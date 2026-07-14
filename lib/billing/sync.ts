import type Stripe from "stripe"

import type { PppTier } from "@/lib/billing/ppp"
import { resolvePlanFromPriceId } from "@/lib/billing/catalog"
import { extraSeatQuantityFromSubscription } from "@/lib/billing/manage-seats"
import { grantMonthlyCredits, nextMonthlyExpiryISO } from "@/lib/credits/ledger"
import { monthlyCreditsForPlan } from "@/lib/pricing/config"
import type { PlanName } from "@/lib/pricing/config"
import { creditsForTier, type PlanTier } from "@/lib/plans"
import { createAdminClient } from "@/lib/supabase/admin"
import type { OrganizationRow } from "@/lib/db/mappers"
import { tierFromPriceId } from "@/lib/stripe/prices"
import { subscriptionPeriodEnd, subscriptionPriceId } from "@/lib/billing/customer"

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
])

export function planTierFromSubscription(
  subscription: Stripe.Subscription,
): PlanTier | null {
  const priceId = subscriptionPriceId(subscription)
  if (!priceId) return null
  return tierFromPriceId(priceId)
}

export async function applyPlanTierToOrg(
  orgId: string,
  tier: PlanTier,
  options?: { resetCredits?: boolean },
): Promise<void> {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = { plan_tier: tier }
  if (options?.resetCredits) {
    patch.credits_remaining = creditsForTier(tier)
  }

  const { error } = await admin.from("organizations").update(patch).eq("id", orgId)
  if (error) {
    throw new Error(`Failed to update plan tier: ${error.message}`)
  }
}

export async function syncSubscriptionToOrg(
  org: OrganizationRow,
  subscription: Stripe.Subscription,
): Promise<void> {
  const priceId = subscriptionPriceId(subscription)
  // Resolve plan/tier/interval from the actual subscription price ID via the DB
  // catalog (authoritative); fall back to checkout metadata for the PPP tier
  // only if the price ID can't be mapped.
  const resolved = priceId ? await resolvePlanFromPriceId(priceId) : null
  const tier = resolved?.planName ?? null
  const billingCycle: "monthly" | "annual" | null = resolved
    ? resolved.interval === "yearly"
      ? "annual"
      : "monthly"
    : null
  const isActive = ACTIVE_STATUSES.has(subscription.status)
  const pppTier =
    resolved?.tier ??
    (subscription.metadata?.ppp_tier as PppTier | undefined) ??
    null
  const periodEnd = subscriptionPeriodEnd(subscription)
  const extraSeats = isActive
    ? await extraSeatQuantityFromSubscription(subscription)
    : 0

  const admin = createAdminClient()
  const { error } = await admin
    .from("organizations")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      billing_cycle: billingCycle,
      current_period_end: periodEnd,
      ppp_tier: isActive ? pppTier : null,
      extra_seats: extraSeats,
      ...(isActive && tier ? { plan_tier: tier } : { plan_tier: "free" }),
    })
    .eq("id", org.id)

  if (error) {
    throw new Error(`Failed to sync subscription: ${error.message}`)
  }

  // Grant this month's credits via the ledger (idempotent per calendar month, so
  // monthly and annual subscribers alike get a fresh allowance each month, and
  // repeated subscription webhooks don't double-grant). Subsequent months are
  // topped up lazily by ensureMonthlyResetsForOrgId.
  if (isActive && tier && tier !== "free") {
    const credits = monthlyCreditsForPlan(tier as PlanName)
    if (credits > 0) {
      await grantMonthlyCredits(org.id, credits, nextMonthlyExpiryISO())
    }
  }
}

export async function downgradeOrgToFree(orgId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("organizations")
    .update({
      plan_tier: "free",
      stripe_subscription_id: null,
      subscription_status: "canceled",
      billing_cycle: null,
      current_period_end: null,
      ppp_tier: null,
      extra_seats: 0,
    })
    .eq("id", orgId)

  if (error) {
    throw new Error(`Failed to downgrade organization: ${error.message}`)
  }

  // Ledger owns the balance now: leftover monthly credits expire at period end,
  // pack credits keep their 24-month life. Refresh the cached mirror.
  await admin.rpc("sync_credit_mirror", { org_id_input: orgId })
}

export async function wasWebhookEventProcessed(eventId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to check webhook event: ${error.message}`)
  }

  return Boolean(data)
}

export async function markWebhookEventProcessed(event: Stripe.Event): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
  })

  if (!error) return
  if (error.code === "23505") return
  throw new Error(`Failed to record webhook event: ${error.message}`)
}
