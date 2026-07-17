import type { PlanTier } from "@/lib/plans"

/** Server-side: enable camera snapshot step for proctored tests. */
export function isCameraProctoringEnabled(): boolean {
  return process.env.PROCTORING_CAMERA_ENABLED === "true"
}

/** Client-side mirror — set NEXT_PUBLIC_PROCTORING_CAMERA_ENABLED=true to match. */
export function isCameraProctoringEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_PROCTORING_CAMERA_ENABLED === "true"
}

export const PROCTORING_RETENTION_DAYS = 60

/**
 * Per-plan proctoring policy. Higher tiers capture more densely — so infra cost
 * scales with what the customer pays. `intervalMs`/`maxSnapshots` drive
 * candidate-side capture. Retention is a single fixed window across all plans
 * (see PROCTORING_RETENTION_DAYS) so the consent copy, purge job, and reviewer
 * UI can state one honest number.
 */
export interface ProctoringPolicy {
  intervalMs: number
  maxSnapshots: number
  defaultRetentionDays: number
  maxRetentionDays: number
  /** Whether the plan records the candidate's screen alongside the camera. */
  screenRecording: boolean
}

const PROCTORING_POLICIES: Record<PlanTier, ProctoringPolicy> = {
  // Free never runs camera proctoring; kept for exhaustiveness with safe values.
  free: {
    intervalMs: 120_000,
    maxSnapshots: 0,
    defaultRetentionDays: PROCTORING_RETENTION_DAYS,
    maxRetentionDays: PROCTORING_RETENTION_DAYS,
    screenRecording: false,
  },
  starter: {
    intervalMs: 90_000,
    maxSnapshots: 20,
    defaultRetentionDays: PROCTORING_RETENTION_DAYS,
    maxRetentionDays: PROCTORING_RETENTION_DAYS,
    screenRecording: false,
  },
  growth: {
    intervalMs: 60_000,
    maxSnapshots: 30,
    defaultRetentionDays: PROCTORING_RETENTION_DAYS,
    maxRetentionDays: PROCTORING_RETENTION_DAYS,
    screenRecording: true,
  },
  custom: {
    intervalMs: 45_000,
    maxSnapshots: 40,
    defaultRetentionDays: PROCTORING_RETENTION_DAYS,
    maxRetentionDays: PROCTORING_RETENTION_DAYS,
    screenRecording: true,
  },
}

export function proctoringPolicyForTier(tier: PlanTier): ProctoringPolicy {
  return PROCTORING_POLICIES[tier] ?? PROCTORING_POLICIES.starter
}
