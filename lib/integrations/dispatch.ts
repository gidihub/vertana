import { randomUUID } from "node:crypto"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"
import { appOrigin } from "@/lib/notifications/send-email"
import { candidateDisplayName } from "@/lib/candidate-name"
import { atsEnabledForTier, type PlanTier } from "@/lib/plans"
import type { Candidate } from "@/lib/types"
import {
  adapterForProvider,
  type DeliveryResult,
} from "@/lib/integrations/adapters"
import {
  selectDeliveries,
  nextBackoffMs,
  type EnabledIntegration,
} from "@/lib/integrations/dispatch-core"
import type {
  AtsEvent,
  AtsEventType,
} from "@/lib/integrations/events"

type Db = SupabaseClient

/** Build a normalized event from a candidate + its test. */
export function buildAtsEvent(input: {
  type: AtsEventType
  orgId: string
  test: { id: string; title: string }
  candidate: Candidate
  percentile?: number | null
}): AtsEvent {
  return {
    id: randomUUID(),
    type: input.type,
    payload: {
      orgId: input.orgId,
      candidate: {
        id: input.candidate.id,
        email: input.candidate.email,
        name: candidateDisplayName(input.candidate.email),
      },
      assessment: { id: input.test.id, title: input.test.title },
      score: input.candidate.score,
      maxScore: 100,
      percentile: input.percentile ?? null,
      disposition: input.candidate.disposition,
      resultUrl: `${appOrigin()}/tests/${input.test.id}/results`,
      occurredAt: new Date().toISOString(),
    },
  }
}

async function orgHasAts(db: Db, orgId: string): Promise<boolean> {
  const { data: org, error } = await db
    .from("organizations")
    .select("plan_tier, is_comp")
    .eq("id", orgId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (org?.is_comp) return true
  const tier = (org?.plan_tier as PlanTier | undefined) ?? "free"
  return atsEnabledForTier(tier)
}

async function enabledIntegrations(
  db: Db,
  orgId: string,
): Promise<EnabledIntegration[]> {
  const { data, error } = await db
    .from("org_integrations")
    .select("provider, config, secret")
    .eq("org_id", orgId)
    .eq("status", "connected")
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    provider: row.provider as string,
    config: (row.config as Record<string, string> | null) ?? {},
    secret: (row.secret as string | null) ?? null,
  }))
}

function toJob(orgId: string, provider: string, event: AtsEvent, now: string) {
  return {
    org_id: orgId,
    provider,
    event_id: event.id,
    event_type: event.type,
    payload: event.payload,
    status: "pending" as const,
    attempts: 0,
    max_attempts: 3,
    next_attempt_at: now,
  }
}

/**
 * Fan an event out to every eligible connected integration by enqueueing a
 * delivery job. Never delivers synchronously; the cron drains the queue.
 * Best-effort: callers should not let a dispatch failure break their request.
 */
export async function dispatchAtsEvent(
  event: AtsEvent,
): Promise<{ enqueued: number }> {
  const db = createAdminClient()
  const [hasAts, integrations] = await Promise.all([
    orgHasAts(db, event.payload.orgId),
    enabledIntegrations(db, event.payload.orgId),
  ])
  const selected = selectDeliveries(integrations, { hasAts })
  if (selected.length === 0) return { enqueued: 0 }

  const now = new Date().toISOString()
  const jobs = selected.map((s) => toJob(event.payload.orgId, s.provider, event, now))
  const { error } = await db.from("ats_delivery_jobs").insert(jobs)
  if (error) throw new Error(error.message)
  return { enqueued: jobs.length }
}

/** Enqueue a synthetic event to one provider so users can verify wiring. */
export async function dispatchTestEvent(
  orgId: string,
  provider: string,
): Promise<{ enqueued: number }> {
  const db = createAdminClient()
  if (!(await orgHasAts(db, orgId))) {
    throw new Error("ATS integrations require the Growth plan or higher.")
  }
  if (!adapterForProvider(provider)) {
    throw new Error("This provider does not support outbound sync yet.")
  }
  const { data: integ } = await db
    .from("org_integrations")
    .select("provider")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .eq("status", "connected")
    .maybeSingle()
  if (!integ) throw new Error("Connect this provider first.")

  const now = new Date().toISOString()
  const event: AtsEvent = {
    id: randomUUID(),
    type: "attempt.submitted",
    payload: {
      orgId,
      candidate: {
        id: "test-candidate",
        email: "test.candidate@example.com",
        name: "Test Candidate",
      },
      assessment: { id: "test-assessment", title: "Vertana test event" },
      score: 87,
      maxScore: 100,
      percentile: 12,
      disposition: "under_review",
      resultUrl: `${appOrigin()}/dashboard`,
      occurredAt: now,
    },
  }
  const { error } = await db
    .from("ats_delivery_jobs")
    .insert(toJob(orgId, provider, event, now))
  if (error) throw new Error(error.message)
  return { enqueued: 1 }
}

async function markIntegration(
  db: Db,
  orgId: string,
  provider: string,
  result: { ok: boolean; error?: string },
) {
  const now = new Date().toISOString()
  await db
    .from("org_integrations")
    .update(
      result.ok
        ? { sync_status: "ok", last_synced_at: now, last_error: null }
        : {
            sync_status: "error",
            last_error: result.error ?? "Delivery failed",
            last_error_at: now,
          },
    )
    .eq("org_id", orgId)
    .eq("provider", provider)
}

interface DeliveryJobRow {
  id: string
  org_id: string
  provider: string
  event_id: string
  event_type: AtsEventType
  payload: AtsEvent["payload"]
  attempts: number
  max_attempts: number
}

/**
 * How long a claimed ("delivering") job may run before it's considered stale.
 * A worker that crashes mid-delivery would otherwise strand the job forever;
 * after this window another run reclaims it back to pending.
 */
const DELIVERY_LEASE_MS = 5 * 60 * 1000

/**
 * Drain due delivery jobs. Claims each job optimistically, runs its adapter,
 * then records the outcome: delivered, retried with backoff (transient errors
 * under the attempt cap), or failed (permanent 4xx or attempts exhausted).
 *
 * Before draining, jobs stuck in "delivering" past the lease window are
 * reclaimed to "pending" so a crashed worker can't strand them. Adapter calls
 * and the follow-up status writes are wrapped so an exception can never leave a
 * job in "delivering".
 */
export async function processAtsDeliveryJobs(
  limit = 25,
): Promise<{ processed: number; delivered: number; retried: number; failed: number }> {
  const db = createAdminClient()

  // Reclaim stale leases: only jobs whose claim is older than the lease window,
  // so an actively-processing job (recent updated_at) is never disturbed.
  const staleCutoff = new Date(Date.now() - DELIVERY_LEASE_MS).toISOString()
  const { error: reclaimError } = await db
    .from("ats_delivery_jobs")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("status", "delivering")
    .lt("updated_at", staleCutoff)
  if (reclaimError) throw new Error(reclaimError.message)

  const now = new Date().toISOString()
  const { data: due, error } = await db
    .from("ats_delivery_jobs")
    .select("id, org_id, provider, event_id, event_type, payload, attempts, max_attempts")
    .eq("status", "pending")
    .lte("next_attempt_at", now)
    .order("next_attempt_at", { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)

  let delivered = 0
  let retried = 0
  let failed = 0
  // Cache entitlement per org for this run to avoid re-querying per job.
  const atsByOrg = new Map<string, boolean>()

  for (const job of (due ?? []) as DeliveryJobRow[]) {
    // Optimistic claim: only proceed if we flip pending -> delivering. The
    // updated_at doubles as the lease start used by stale reclaiming above.
    const { data: claimed, error: claimError } = await db
      .from("ats_delivery_jobs")
      .update({ status: "delivering", updated_at: new Date().toISOString() })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle()
    if (claimError) throw new Error(claimError.message)
    if (!claimed) continue

    const attempts = (job.attempts ?? 0) + 1

    try {
      let result: DeliveryResult
      const adapter = adapterForProvider(job.provider)

      // Re-check entitlement at delivery time: an org may have downgraded after
      // the job was enqueued. Without ATS entitlement, terminally skip the job.
      let hasAts = atsByOrg.get(job.org_id)
      if (hasAts === undefined) {
        hasAts = await orgHasAts(db, job.org_id)
        atsByOrg.set(job.org_id, hasAts)
      }

      if (!hasAts) {
        result = {
          ok: false,
          error: "ATS integrations require the Growth plan or higher.",
          retriable: false,
        }
      } else if (!adapter) {
        result = { ok: false, error: `No adapter for ${job.provider}`, retriable: false }
      } else {
        const { data: integ } = await db
          .from("org_integrations")
          .select("config, secret, status")
          .eq("org_id", job.org_id)
          .eq("provider", job.provider)
          .maybeSingle()
        if (!integ || integ.status !== "connected") {
          result = { ok: false, error: "Integration not connected", retriable: false }
        } else {
          result = await adapter.deliver(
            { id: job.event_id, type: job.event_type, payload: job.payload },
            (integ.config as Record<string, string> | null) ?? {},
            { secret: (integ.secret as string | null) ?? undefined },
          )
        }
      }

      const updatedAt = new Date().toISOString()

      if (result.ok) {
        const { error: writeError } = await db
          .from("ats_delivery_jobs")
          .update({
            status: "delivered",
            attempts,
            last_status: result.status ?? null,
            last_error: null,
            updated_at: updatedAt,
          })
          .eq("id", job.id)
        if (writeError) throw new Error(writeError.message)
        await markIntegration(db, job.org_id, job.provider, { ok: true })
        delivered++
      } else if (result.retriable && attempts < (job.max_attempts ?? 3)) {
        const { error: writeError } = await db
          .from("ats_delivery_jobs")
          .update({
            status: "pending",
            attempts,
            next_attempt_at: new Date(Date.now() + nextBackoffMs(attempts)).toISOString(),
            last_status: result.status ?? null,
            last_error: result.error ?? null,
            updated_at: updatedAt,
          })
          .eq("id", job.id)
        if (writeError) throw new Error(writeError.message)
        await markIntegration(db, job.org_id, job.provider, {
          ok: false,
          error: result.error,
        })
        retried++
      } else {
        const { error: writeError } = await db
          .from("ats_delivery_jobs")
          .update({
            status: "failed",
            attempts,
            last_status: result.status ?? null,
            last_error: result.error ?? null,
            updated_at: updatedAt,
          })
          .eq("id", job.id)
        if (writeError) throw new Error(writeError.message)
        await markIntegration(db, job.org_id, job.provider, {
          ok: false,
          error: result.error,
        })
        failed++
      }
    } catch (err) {
      // The adapter or a status write threw: never leave the job "delivering".
      // Persist the attempt and either re-queue (under the cap) or fail it.
      const message = (err as Error).message ?? "Delivery error"
      const canRetry = attempts < (job.max_attempts ?? 3)
      const { error: recoveryError } = await db
        .from("ats_delivery_jobs")
        .update({
          status: canRetry ? "pending" : "failed",
          attempts,
          next_attempt_at: canRetry
            ? new Date(Date.now() + nextBackoffMs(attempts)).toISOString()
            : now,
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
      // If we can't even persist the recovery state the job is stranded in
      // "delivering"; surface that rather than silently continuing.
      if (recoveryError) throw new Error(recoveryError.message)
      await markIntegration(db, job.org_id, job.provider, {
        ok: false,
        error: message,
      }).catch(() => {})
      if (canRetry) retried++
      else failed++
    }
  }

  return { processed: due?.length ?? 0, delivered, retried, failed }
}
