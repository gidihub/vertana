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

export function priceIdForTier(
  tier: CheckoutTier,
  cycle: BillingCycle,
): string | null {
  const envKey = PRICE_ENV_KEYS[tier][cycle]
  const value = process.env[envKey]?.trim()
  return value || null
}

export function tierFromPriceId(priceId: string): PlanTier | null {
  const normalized = priceId.trim()
  for (const tier of ["starter", "growth"] as const) {
    for (const cycle of ["monthly", "annual"] as const) {
      if (priceIdForTier(tier, cycle) === normalized) return tier
    }
  }
  return null
}

export function billingCycleFromPriceId(priceId: string): BillingCycle | null {
  const normalized = priceId.trim()
  for (const tier of ["starter", "growth"] as const) {
    if (priceIdForTier(tier, "monthly") === normalized) return "monthly"
    if (priceIdForTier(tier, "annual") === normalized) return "annual"
  }
  return null
}
