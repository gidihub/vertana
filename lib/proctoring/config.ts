import type { PlanTier } from "@/lib/plans"

/** Server-side: enable camera snapshot step for proctored tests. */
export function isCameraProctoringEnabled(): boolean {
  return process.env.PROCTORING_CAMERA_ENABLED === "true"
}

/** Client-side mirror — set NEXT_PUBLIC_PROCTORING_CAMERA_ENABLED=true to match. */
export function isCameraProctoringEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_PROCTORING_CAMERA_ENABLED === "true"
}

export const PROCTORING_RETENTION_DAYS = 90

/**
 * Per-plan proctoring policy. Higher tiers capture more densely and retain
 * longer — so infra cost (snapshot volume × retention) scales with what the
 * customer pays. `intervalMs`/`maxSnapshots` drive candidate-side capture;
 * `defaultRetentionDays`/`maxRetentionDays` bound how long media is kept.
 */
export interface ProctoringPolicy {
  intervalMs: number
  maxSnapshots: number
  defaultRetentionDays: number
  maxRetentionDays: number
}

const PROCTORING_POLICIES: Record<PlanTier, ProctoringPolicy> = {
  // Free never runs camera proctoring; kept for exhaustiveness with safe values.
  free: {
    intervalMs: 120_000,
    maxSnapshots: 0,
    defaultRetentionDays: 90,
    maxRetentionDays: 90,
  },
  starter: {
    intervalMs: 90_000,
    maxSnapshots: 20,
    defaultRetentionDays: 90,
    maxRetentionDays: 90,
  },
  growth: {
    intervalMs: 60_000,
    maxSnapshots: 30,
    defaultRetentionDays: 180,
    maxRetentionDays: 365,
  },
  custom: {
    intervalMs: 45_000,
    maxSnapshots: 40,
    defaultRetentionDays: 365,
    maxRetentionDays: 3650,
  },
}

export function proctoringPolicyForTier(tier: PlanTier): ProctoringPolicy {
  return PROCTORING_POLICIES[tier] ?? PROCTORING_POLICIES.starter
}
