import { checkRateLimit } from "@/lib/rate-limit"

const HOUR_LIMIT = 5
const DAY_LIMIT = 20
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

export type SolvabilityRateLimitState =
  | { allowed: true }
  | {
      allowed: false
      reason: "hourly" | "daily"
      resetAt: number
    }

export function checkSolvabilityRateLimit(ip: string): SolvabilityRateLimitState {
  const hour = checkRateLimit({
    key: ip,
    namespace: "solvability:ip:hour",
    limit: HOUR_LIMIT,
    windowMs: HOUR_MS,
  })

  if (!hour.success) {
    return { allowed: false, reason: "hourly", resetAt: hour.resetAt }
  }

  const day = checkRateLimit({
    key: ip,
    namespace: "solvability:ip:day",
    limit: DAY_LIMIT,
    windowMs: DAY_MS,
  })

  if (!day.success) {
    return { allowed: false, reason: "daily", resetAt: day.resetAt }
  }

  return { allowed: true }
}

export function solvabilityRateLimitMessage(
  reason: "hourly" | "daily",
): string {
  if (reason === "hourly") {
    return "You've used your 5 free checks this hour. Create a free Vertana account for unlimited question design — or try again later."
  }
  return "You've reached today's limit of 20 checks. Sign up free to build AI-resistant assessments — or come back tomorrow."
}
