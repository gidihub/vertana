/**
 * Presentation helpers for the pricing page. All numeric values (credits, AI
 * generations, prices) are pulled from PlanConfig so a config change propagates
 * to the UI automatically. Only static marketing copy lives here.
 */

import type { BillingInterval, PlanConfig, PlanName } from "@/lib/pricing/config"
import { displayPriceCents, formatUsd } from "@/lib/pricing"

const BUYER_LINES: Record<PlanName, string> = {
  free: "Best for trying your first role",
  starter: "Best for steady hiring, a role or two",
  growth: "Best for teams hiring across multiple roles",
  custom: "Best for high-volume or regulated hiring",
}

const CTA_LABELS: Record<PlanName, string> = {
  free: "Get started",
  starter: "Start Starter",
  growth: "Start Growth",
  custom: "Contact sales",
}

export function buyerLine(plan: PlanName): string {
  return BUYER_LINES[plan]
}

export function ctaLabel(plan: PlanName): string {
  return CTA_LABELS[plan]
}

export const PLAN_ORDER: PlanName[] = ["free", "starter", "growth", "custom"]

function activeTestsLabel(plan: PlanConfig): string {
  if (plan.name === "custom") return "Unlimited active tests"
  return plan.activeTestLimit == null
    ? "Unlimited active tests"
    : `${plan.activeTestLimit} active tests`
}

function seatsLabel(plan: PlanConfig): string {
  if (plan.seatsIncluded == null) return "Unlimited team seats"
  return `${plan.seatsIncluded} team seats included`
}

/** Highlight line on each plan card — seat count, not unlimited. */
export function seatsBadgeLabel(plan: PlanConfig): string {
  if (plan.seatsIncluded == null) return "Unlimited seats included"
  return `${plan.seatsIncluded} seats included · no per-seat pricing`
}

/** 5–6 feature bullets per card, numbers sourced from config. */
export function planFeatureBullets(plan: PlanConfig): string[] {
  if (plan.name === "custom") {
    return [
      "Custom candidate credit volume",
      "Custom AI question generation",
      "SSO, audit logs & DPA",
      "Custom data-retention windows",
      "Dedicated priority support",
      "Everything in Growth",
    ]
  }

  const credits = plan.monthlyCredits ?? 0
  const ai = plan.aiGenerationsPerMonth ?? 0
  const bullets = [
    `${credits} candidate credits / month`,
    activeTestsLabel(plan),
    `${ai} AI-generated questions / month`,
  ]

  if (plan.name === "free") {
    bullets.push(
      seatsLabel(plan),
      "All question types, incl. coding IDE",
      "Tab-switch integrity detection",
    )
  } else if (plan.name === "starter") {
    bullets.push(
      seatsLabel(plan),
      "Proctoring + face verification",
      "Candidate certificates",
      "Everything in Free",
    )
  } else if (plan.name === "growth") {
    bullets.push(
      seatsLabel(plan),
      "ATS integrations",
      "Priority support",
      "Everything in Starter",
    )
  }

  return bullets
}

/** Secondary price line under the headline number. */
export function secondaryPriceLine(
  plan: PlanConfig,
  interval: BillingInterval,
): string {
  if (plan.name === "free") return "Free forever"
  if (plan.name === "custom") return ""
  if (interval === "yearly" && plan.yearlyPriceCents != null) {
    return `Billed ${formatUsd(plan.yearlyPriceCents)}/yr`
  }
  return ""
}

/** Headline price string, e.g. "$27" or "Contact sales". */
export function headlinePrice(
  plan: PlanConfig,
  interval: BillingInterval,
): string {
  const cents = displayPriceCents(plan, interval)
  if (cents == null) return "Contact sales"
  return formatUsd(cents)
}
