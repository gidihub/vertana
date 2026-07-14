/**
 * DB-backed Stripe price catalog.
 *
 * The `plans` / `credit_packs` tables are the source of truth for which Stripe
 * Price ID corresponds to a given plan/pack + PPP tier + interval. Checkout
 * resolves prices forward (plan -> price id) and webhooks resolve them backward
 * (price id -> plan). Env vars are used only as a fallback when a DB column is
 * not yet populated (e.g. before scripts/setup-stripe.ts has been run).
 */

import { ANCHOR_TIER, type PppTier } from "@/lib/billing/ppp"
import type { BillingInterval } from "@/lib/pricing/config"
import type { PlanTier } from "@/lib/plans"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  billingCycleFromPriceId,
  packPriceId,
  priceIdForTier,
  pppTierFromPriceId,
  tierFromPriceId,
  type PackId,
} from "@/lib/stripe/prices"

export type SubscriptionPlanName = "starter" | "growth"

/** Forward: resolve the Stripe Price ID for a subscription plan. */
export async function resolvePlanPriceId(
  planName: SubscriptionPlanName,
  tier: PppTier,
  interval: BillingInterval,
): Promise<string | null> {
  const column =
    interval === "yearly" ? "stripe_yearly_price_id" : "stripe_monthly_price_id"

  const admin = createAdminClient()
  const { data } = await admin
    .from("plans")
    .select(column)
    .eq("name", planName)
    .eq("tier", tier)
    .maybeSingle()

  const fromDb = (data as Record<string, string | null> | null)?.[column]
  if (fromDb) return fromDb

  // Fallback to env until the DB is provisioned.
  return priceIdForTier(planName, interval === "yearly" ? "annual" : "monthly", tier)
}

/** Forward: resolve the Stripe Price ID for a one-time credit pack. */
export async function resolvePackPriceId(
  packId: PackId,
  tier: PppTier,
): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("credit_packs")
    .select("stripe_price_id")
    .eq("name", packId)
    .eq("tier", tier)
    .maybeSingle()

  const fromDb = (data as { stripe_price_id: string | null } | null)?.stripe_price_id
  if (fromDb) return fromDb

  return packPriceId(packId, tier)
}

/** Forward: resolve the Stripe recurring Price ID for one extra seat at a tier. */
export async function resolveExtraSeatPriceId(
  tier: PppTier,
): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("plans")
    .select("stripe_extra_seat_price_id")
    .eq("name", "growth")
    .eq("tier", tier)
    .maybeSingle()

  return (
    (data as { stripe_extra_seat_price_id: string | null } | null)
      ?.stripe_extra_seat_price_id ?? null
  )
}

/** Set of extra-seat Price IDs across all tiers (to identify the item on a sub). */
export async function extraSeatPriceIds(): Promise<Set<string>> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("plans")
    .select("stripe_extra_seat_price_id")
    .not("stripe_extra_seat_price_id", "is", null)

  const ids = new Set<string>()
  for (const row of (data as { stripe_extra_seat_price_id: string | null }[] | null) ??
    []) {
    if (row.stripe_extra_seat_price_id) ids.add(row.stripe_extra_seat_price_id)
  }
  return ids
}

export interface ResolvedPlanFromPrice {
  planName: PlanTier
  tier: PppTier
  interval: BillingInterval
}

/** Reverse: map a subscription Price ID back to its plan/tier/interval. */
export async function resolvePlanFromPriceId(
  priceId: string,
): Promise<ResolvedPlanFromPrice | null> {
  const normalized = priceId.trim()

  const admin = createAdminClient()
  const { data } = await admin
    .from("plans")
    .select("name, tier, stripe_monthly_price_id, stripe_yearly_price_id")
    .or(
      `stripe_monthly_price_id.eq.${normalized},stripe_yearly_price_id.eq.${normalized}`,
    )
    .maybeSingle()

  if (data) {
    const row = data as {
      name: PlanTier
      tier: PppTier
      stripe_monthly_price_id: string | null
      stripe_yearly_price_id: string | null
    }
    const interval: BillingInterval =
      row.stripe_yearly_price_id === normalized ? "yearly" : "monthly"
    return { planName: row.name, tier: row.tier, interval }
  }

  // Fallback to env-based reverse mapping.
  const planName = tierFromPriceId(normalized)
  if (!planName) return null
  const cycle = billingCycleFromPriceId(normalized)
  const tier = pppTierFromPriceId(normalized) ?? ANCHOR_TIER
  return {
    planName,
    tier,
    interval: cycle === "annual" ? "yearly" : "monthly",
  }
}
