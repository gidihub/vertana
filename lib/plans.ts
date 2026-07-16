export type PlanTier = "free" | "starter" | "growth" | "custom"

export interface PlanLimits {
  candidateCredits: number
  activeTests: number | null // null = unlimited
  aiGenerations: number
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    candidateCredits: 10,
    activeTests: 2,
    aiGenerations: 5,
  },
  starter: {
    candidateCredits: 100,
    activeTests: null,
    aiGenerations: 30,
  },
  growth: {
    candidateCredits: 300,
    activeTests: null,
    aiGenerations: 100,
  },
  custom: {
    candidateCredits: 999_999,
    activeTests: null,
    aiGenerations: 999_999,
  },
}

export function creditsForTier(tier: PlanTier): number {
  return PLAN_LIMITS[tier].candidateCredits
}

export function aiLimitForTier(tier: PlanTier): number {
  return PLAN_LIMITS[tier].aiGenerations
}

export function certificatesEnabledForTier(tier: PlanTier): boolean {
  return tier !== "free"
}

/**
 * Coding IDE is available on every plan, including Free, in every region.
 * (Kept as a function so callers have a single entitlement source of truth.)
 */
export function codingQuestionsEnabledForTier(_tier: PlanTier): boolean {
  return true
}

/** Proctoring + face verification is a paid feature — never available on Free. */
export function proctoringEnabledForTier(tier: PlanTier): boolean {
  return tier !== "free"
}

/** ATS integrations (outbound sync) are a Growth+ feature. Mirrors PlanConfig.hasAts. */
export function atsEnabledForTier(tier: PlanTier): boolean {
  return tier === "growth" || tier === "custom"
}

export function isPaidPlanTier(tier: PlanTier): boolean {
  return tier === "starter" || tier === "growth" || tier === "custom"
}
