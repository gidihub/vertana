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
    candidateCredits: 400,
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
