/**
 * Pricing resolution — single entry point used by both the pricing page
 * (server component) and Stripe checkout (server actions).
 *
 * PPP tier detection happens server-side from trusted edge headers. The client
 * never sends a price or a tier; it only ever sends a plan name + interval.
 */

import {
  ANCHOR_TIER,
  detectCountryFromHeaders,
  isBlockedCountry,
  pppTierForCountry,
} from "@/lib/billing/ppp"
import type { HeadersLike, PppTier } from "@/lib/billing/ppp"
import { pricingForTier } from "@/lib/pricing/config"
import type {
  BillingInterval,
  PackConfig,
  PlanConfig,
  PlanName,
  TierPricing,
} from "@/lib/pricing/config"

export type { BillingInterval, PackConfig, PlanConfig, PlanName, TierPricing }

export interface ResolvedPricing extends TierPricing {
  /** Detected country (raw header value) — for banner copy / debugging. */
  country: string | null
  /** Whether the resolved tier differs from the default anchor pricing. */
  isRegional: boolean
  /** Sanctioned/embargoed jurisdiction — do not serve pricing. */
  blocked: boolean
}

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

/** Format whole-dollar USD, e.g. 3900 -> "$39". */
export function formatUsd(cents: number): string {
  return USD.format(cents / 100)
}

/**
 * Resolve the full plan + pack table for the PPP tier detected from headers.
 * Unknown / missing country → anchor tier (full price), always.
 */
export function getPricingForRequest(headers: HeadersLike): ResolvedPricing {
  const country = detectCountryFromHeaders(headers)
  const tier = pppTierForCountry(country)
  return {
    ...pricingForTier(tier),
    country,
    isRegional: tier !== ANCHOR_TIER,
    blocked: isBlockedCountry(country),
  }
}

/** Server-authoritative tier resolution for checkout. */
export function resolveTierFromHeaders(headers: HeadersLike): PppTier {
  return pppTierForCountry(detectCountryFromHeaders(headers))
}

/** Headline price for a plan at the selected interval. Yearly shows per-month. */
export function displayPriceCents(
  plan: PlanConfig,
  interval: BillingInterval,
): number | null {
  if (interval === "yearly") {
    return plan.yearlyPriceCents == null ? null : Math.round(plan.yearlyPriceCents / 12)
  }
  return plan.monthlyPriceCents
}

/** Per-candidate cost in dollars for a plan, computed from config (not hardcoded). */
export function perCandidateCost(plan: PlanConfig): number | null {
  if (!plan.monthlyPriceCents || !plan.monthlyCredits) return null
  return plan.monthlyPriceCents / 100 / plan.monthlyCredits
}

/** Format a per-candidate cost like "$0.13". */
export function formatPerCandidate(cost: number): string {
  return `$${cost.toFixed(2)}`
}

/** Per-candidate cost for a credit pack, in dollars. */
export function packPerCandidateCost(pack: PackConfig): number {
  return pack.priceCents / 100 / pack.credits
}
