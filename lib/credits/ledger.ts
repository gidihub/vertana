/**
 * Credit consumption + granting service.
 *
 * The credit_ledger is the source of truth (balance = sum of non-expired
 * deltas). organizations.credits_remaining is a cached mirror kept in sync by
 * the SQL functions. All mutations go through service-role RPCs.
 */

import { createAdminClient } from "@/lib/supabase/admin"

/** Thrown when an org has insufficient credits for the requested consumption. */
export class InsufficientCreditsError extends Error {
  readonly code = "insufficient_credits" as const
  constructor(message = "Insufficient candidate credits") {
    super(message)
    this.name = "InsufficientCreditsError"
  }
}

export type ConsumeKind = "proctored_start" | "completion"

const KIND_CONFIG: Record<ConsumeKind, { amount: number; reason: string }> = {
  proctored_start: { amount: 2, reason: "attempt_start_proctored" },
  completion: { amount: 1, reason: "attempt_completion" },
}

/** Current non-expired credit balance for an org. */
export async function getCreditBalance(orgId: string): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("credit_balance", {
    org_id_input: orgId,
  })
  if (error) throw new Error(`Failed to read credit balance: ${error.message}`)
  return (data as number | null) ?? 0
}

/**
 * Consume credits for a candidate attempt.
 * - `proctored_start`: −2 credits, at attempt start (recording begins at start).
 * - `completion`: −1 credit, on submission of an unproctored assessment.
 *
 * Throws InsufficientCreditsError if the balance is too low (nothing consumed).
 */
export async function consumeCredits(
  orgId: string,
  attemptId: string | null,
  kind: ConsumeKind,
): Promise<void> {
  const { amount, reason } = KIND_CONFIG[kind]
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("consume_credits", {
    org_id_input: orgId,
    amount_input: amount,
    reason_input: reason,
    attempt_id_input: attemptId,
  })
  if (error) throw new Error(`Failed to consume credits: ${error.message}`)
  if (data === false) {
    throw new InsufficientCreditsError()
  }
}

/** Number of credits a given consumption kind requires. */
export function creditsRequiredFor(kind: ConsumeKind): number {
  return KIND_CONFIG[kind].amount
}

/**
 * Expiry for a monthly grant: the first of next calendar month (UTC). Using a
 * calendar-month cadence (rather than the Stripe subscription period end) means
 * annual subscribers still receive a fresh monthly allowance every month, and
 * grants stay idempotent per month across both the webhook and lazy-reset paths.
 */
export function nextMonthlyExpiryISO(): string {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  ).toISOString()
}

/**
 * Grant an org its monthly plan credits (idempotent per period). Expires the
 * previous period's unused remainder — monthly credits do not roll over.
 */
export async function grantMonthlyCredits(
  orgId: string,
  amount: number,
  periodEnd: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc("grant_monthly_credits", {
    org_id_input: orgId,
    amount_input: amount,
    period_end_input: periodEnd,
  })
  if (error) throw new Error(`Failed to grant monthly credits: ${error.message}`)
}

/** Record a one-time credit-pack purchase (24-month expiry, idempotent). */
export async function recordPackPurchase(input: {
  orgId: string
  creditPackId: string | null
  credits: number
  pricePaidCents: number
  stripePaymentIntentId: string | null
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc("record_pack_purchase", {
    org_id_input: input.orgId,
    credit_pack_id_input: input.creditPackId,
    credits_input: input.credits,
    price_paid_cents_input: input.pricePaidCents,
    stripe_payment_intent_id_input: input.stripePaymentIntentId,
  })
  if (error) throw new Error(`Failed to record pack purchase: ${error.message}`)
}
