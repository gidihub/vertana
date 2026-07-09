import type { Test, TimingPolicy } from "@/lib/types"

export const TIMING_POLICY_OPTIONS: {
  value: TimingPolicy
  label: string
  description: string
}[] = [
  {
    value: "strict",
    label: "Strict",
    description: "Enforce the exact time limit",
  },
  {
    value: "normal",
    label: "Normal",
    description: "Add a 50% time buffer",
  },
  {
    value: "relaxed",
    label: "Relaxed",
    description: "Add a 200% time buffer",
  },
]

export function timingPolicyMultiplier(policy: TimingPolicy = "normal"): number {
  switch (policy) {
    case "strict":
      return 1
    case "normal":
      return 1.5
    case "relaxed":
      return 3
  }
}

export function effectiveTimeLimitSeconds(
  test: Pick<Test, "time_limit_minutes" | "timing_policy">,
): number {
  const base = (test.time_limit_minutes || 30) * 60
  return Math.round(base * timingPolicyMultiplier(test.timing_policy ?? "normal"))
}

export function effectiveTimeLimitMinutes(
  test: Pick<Test, "time_limit_minutes" | "timing_policy">,
): number {
  return Math.round(effectiveTimeLimitSeconds(test) / 60)
}

export function timingPolicyLabel(policy: TimingPolicy = "normal"): string {
  return (
    TIMING_POLICY_OPTIONS.find((option) => option.value === policy)?.label ??
    "Normal"
  )
}

export function formatAllottedTimeLabel(
  test: Pick<Test, "time_limit_minutes" | "timing_policy">,
): string {
  const allotted = effectiveTimeLimitMinutes(test)
  const base = test.time_limit_minutes || 30
  const policy = test.timing_policy ?? "normal"

  if (policy === "strict") {
    return `${allotted} minute${allotted === 1 ? "" : "s"}`
  }

  return `${allotted} minutes (${base} min base · ${timingPolicyLabel(policy).toLowerCase()} timing)`
}

export function computeRemainingSeconds(
  test: Pick<Test, "time_limit_minutes" | "timing_policy">,
  startedAt?: string | null,
): number {
  const total = effectiveTimeLimitSeconds(test)
  if (!startedAt) return total

  const elapsed = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 1000,
  )
  return Math.max(0, total - elapsed)
}
