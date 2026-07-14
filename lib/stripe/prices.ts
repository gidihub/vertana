import type { PppTier } from "@/lib/billing/ppp"
import { ANCHOR_TIER, PPP_ENV_SUFFIX } from "@/lib/billing/ppp"
import type { PlanTier } from "@/lib/plans"

export type BillingCycle = "monthly" | "annual"
export type CheckoutTier = "starter" | "growth"

const PRICE_ENV_KEYS: Record<CheckoutTier, Record<BillingCycle, string>> = {
  starter: {
    monthly: "STRIPE_PRICE_STARTER_MONTHLY",
    annual: "STRIPE_PRICE_STARTER_ANNUAL",
  },
  growth: {
    monthly: "STRIPE_PRICE_GROWTH_MONTHLY",
    annual: "STRIPE_PRICE_GROWTH_ANNUAL",
  },
}

const PPP_TIERS = Object.keys(PPP_ENV_SUFFIX) as PppTier[]

function readPriceEnv(envKey: string): string | null {
  const value = process.env[envKey]?.trim()
  return value || null
}

export function priceIdForTier(
  tier: CheckoutTier,
  cycle: BillingCycle,
  pppTier: PppTier = ANCHOR_TIER,
): string | null {
  const baseKey = PRICE_ENV_KEYS[tier][cycle]
  if (pppTier === ANCHOR_TIER) {
    return readPriceEnv(baseKey)
  }
  const suffix = PPP_ENV_SUFFIX[pppTier]
  return readPriceEnv(`${baseKey}${suffix}`)
}

export function tierFromPriceId(priceId: string): PlanTier | null {
  const normalized = priceId.trim()
  for (const tier of ["starter", "growth"] as const) {
    for (const cycle of ["monthly", "annual"] as const) {
      for (const pppTier of PPP_TIERS) {
        if (priceIdForTier(tier, cycle, pppTier) === normalized) return tier
      }
    }
  }
  return null
}

// --- Credit packs (one-time payment prices) ---

export type PackId = "pack_50" | "pack_200" | "pack_500"

const PACK_ENV_KEYS: Record<PackId, string> = {
  pack_50: "STRIPE_PRICE_PACK_50",
  pack_200: "STRIPE_PRICE_PACK_200",
  pack_500: "STRIPE_PRICE_PACK_500",
}

export function packPriceId(
  packId: PackId,
  pppTier: PppTier = ANCHOR_TIER,
): string | null {
  const baseKey = PACK_ENV_KEYS[packId]
  if (pppTier === ANCHOR_TIER) {
    return readPriceEnv(baseKey)
  }
  const suffix = PPP_ENV_SUFFIX[pppTier]
  return readPriceEnv(`${baseKey}${suffix}`)
}

export function billingCycleFromPriceId(priceId: string): BillingCycle | null {
  const normalized = priceId.trim()
  for (const tier of ["starter", "growth"] as const) {
    for (const pppTier of PPP_TIERS) {
      if (priceIdForTier(tier, "monthly", pppTier) === normalized) return "monthly"
      if (priceIdForTier(tier, "annual", pppTier) === normalized) return "annual"
    }
  }
  return null
}

/** Reverse-map a subscription price ID back to its PPP tier (authoritative). */
export function pppTierFromPriceId(priceId: string): PppTier | null {
  const normalized = priceId.trim()
  for (const tier of ["starter", "growth"] as const) {
    for (const cycle of ["monthly", "annual"] as const) {
      for (const pppTier of PPP_TIERS) {
        if (priceIdForTier(tier, cycle, pppTier) === normalized) return pppTier
      }
    }
  }
  return null
}
