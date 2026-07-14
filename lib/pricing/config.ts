/**
 * Vertana pricing — single source of truth.
 *
 * Every product feature is available on every PAID plan. The only feature not
 * on Free is proctoring + face verification (the one line with real per-candidate
 * cost). Plans otherwise differ in volume (credits, AI generations, active tests),
 * ATS integrations, and enterprise controls. Regional (PPP) pricing varies the
 * dollar amounts by tier but never the feature set or credit allowances.
 *
 * These values are the canonical config seeded into the `plans` / `credit_packs`
 * tables (migration 021). Runtime code reads from here so a price change here
 * propagates everywhere (page, math strips, checkout).
 *
 * Stripe Price IDs are NOT stored here — they are environment-specific and live
 * in env vars resolved server-side at checkout (see lib/stripe/prices.ts).
 */

import { ANCHOR_TIER, PPP_TIERS, type PppTier } from "@/lib/pricing/geo"

export type PlanName = "free" | "starter" | "growth" | "custom"
export type BillingInterval = "monthly" | "yearly"

export interface PlanConfig {
  name: PlanName
  /** null = contact sales (Custom). */
  monthlyPriceCents: number | null
  /** Total billed per year, in cents. null = contact sales. */
  yearlyPriceCents: number | null
  /** Monthly candidate credits. null = custom volume. */
  monthlyCredits: number | null
  /** AI-generated questions per month. null = custom. */
  aiGenerationsPerMonth: number | null
  /** null = unlimited active tests. */
  activeTestLimit: number | null
  hasCertificates: boolean
  hasAts: boolean
  hasEnterpriseControls: boolean
  /** Proctoring + face verification. Paid plans only — never on Free. */
  hasProctoring: boolean
}

export interface PackConfig {
  /** Stable identifier, e.g. "pack_50". */
  id: string
  /** Human label, e.g. "50 credits". */
  label: string
  credits: number
  priceCents: number
  /** Discounted price shown to active subscribers (15% off). */
  subscriberPriceCents: number
}

export interface TierPricing {
  tier: PppTier
  plans: Record<PlanName, PlanConfig>
  packs: PackConfig[]
}

/** Yearly display price ≈ 31% off monthly, rounded to whole dollars. */
const YEARLY_FACTOR = 0.69

/** Subscribers get 15% off credit packs. */
export const SUBSCRIBER_PACK_DISCOUNT = 0.15

/** Base monthly plan prices (USD dollars) per PPP tier. Free/Custom handled separately. */
const PLAN_MONTHLY_DOLLARS: Record<PppTier, { starter: number; growth: number }> = {
  t1: { starter: 19, growth: 39 },
  t2: { starter: 13, growth: 27 },
  t3: { starter: 9, growth: 19 },
  t4: { starter: 7, growth: 15 },
  t5: { starter: 5, growth: 10 },
}

/** Volume + capability limits are identical across every PPP tier. */
const PLAN_VOLUME = {
  free: {
    monthlyCredits: 10,
    aiGenerationsPerMonth: 5,
    activeTestLimit: 2 as number | null,
    hasCertificates: false,
    hasAts: false,
    hasEnterpriseControls: false,
    hasProctoring: false,
  },
  starter: {
    monthlyCredits: 100,
    aiGenerationsPerMonth: 30,
    activeTestLimit: null as number | null,
    hasCertificates: true,
    hasAts: false,
    hasEnterpriseControls: false,
    hasProctoring: true,
  },
  growth: {
    monthlyCredits: 300,
    aiGenerationsPerMonth: 100,
    activeTestLimit: null as number | null,
    hasCertificates: true,
    hasAts: true,
    hasEnterpriseControls: false,
    hasProctoring: true,
  },
} as const

/** Base credit-pack sizes/prices (anchor tier, USD dollars). */
const PACK_BASE: { id: string; credits: number; dollars: number }[] = [
  { id: "pack_50", credits: 50, dollars: 49 },
  { id: "pack_200", credits: 200, dollars: 149 },
  { id: "pack_500", credits: 500, dollars: 299 },
]

/** Pack discount fraction off the anchor (t1) price, per PPP tier. */
const PACK_DISCOUNT: Record<PppTier, number> = {
  t1: 0,
  t2: 0.3,
  t3: 0.5,
  t4: 0.6,
  t5: 0.7,
}

function yearlyTotalCents(monthlyDollars: number): number {
  const perMonthDollars = Math.round(monthlyDollars * YEARLY_FACTOR)
  return perMonthDollars * 12 * 100
}

function buildPlans(tier: PppTier): Record<PlanName, PlanConfig> {
  const { starter, growth } = PLAN_MONTHLY_DOLLARS[tier]
  return {
    free: {
      name: "free",
      monthlyPriceCents: 0,
      yearlyPriceCents: 0,
      ...PLAN_VOLUME.free,
    },
    starter: {
      name: "starter",
      monthlyPriceCents: starter * 100,
      yearlyPriceCents: yearlyTotalCents(starter),
      ...PLAN_VOLUME.starter,
    },
    growth: {
      name: "growth",
      monthlyPriceCents: growth * 100,
      yearlyPriceCents: yearlyTotalCents(growth),
      ...PLAN_VOLUME.growth,
    },
    custom: {
      name: "custom",
      monthlyPriceCents: null,
      yearlyPriceCents: null,
      monthlyCredits: null,
      aiGenerationsPerMonth: null,
      activeTestLimit: null,
      hasCertificates: true,
      hasAts: true,
      hasEnterpriseControls: true,
      hasProctoring: true,
    },
  }
}

function buildPacks(tier: PppTier): PackConfig[] {
  const discount = PACK_DISCOUNT[tier]
  return PACK_BASE.map((pack) => {
    const priceCents = Math.floor(pack.dollars * (1 - discount)) * 100
    return {
      id: pack.id,
      label: `${pack.credits} credits`,
      credits: pack.credits,
      priceCents,
      subscriberPriceCents: Math.round(priceCents * (1 - SUBSCRIBER_PACK_DISCOUNT)),
    }
  })
}

/** Full resolved pricing table for every PPP tier. */
export const PRICING_BY_TIER: Record<PppTier, TierPricing> = Object.fromEntries(
  PPP_TIERS.map((tier) => [
    tier,
    { tier, plans: buildPlans(tier), packs: buildPacks(tier) } satisfies TierPricing,
  ]),
) as Record<PppTier, TierPricing>

export function pricingForTier(tier: PppTier): TierPricing {
  return PRICING_BY_TIER[tier]
}

/** Monthly credits granted for a plan (anchor volume applies to every tier). */
export function monthlyCreditsForPlan(plan: PlanName): number {
  return PRICING_BY_TIER[ANCHOR_TIER].plans[plan].monthlyCredits ?? 0
}
