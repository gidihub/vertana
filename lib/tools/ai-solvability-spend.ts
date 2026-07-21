const DAY_MS = 86_400_000

type SpendBucket = { count: number; resetAt: number }

let dailySpend: SpendBucket | null = null

function defaultDailyLimit(): number {
  const raw = process.env.AI_SOLVABILITY_DAILY_LIMIT?.trim()
  const parsed = raw ? Number(raw) : 200
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 200
}

export function isSolvabilityKillSwitchActive(): boolean {
  const flag = process.env.AI_SOLVABILITY_DISABLED?.trim().toLowerCase()
  return flag === "1" || flag === "true" || flag === "yes"
}

export function checkSolvabilitySpendCeiling(): {
  allowed: boolean
  limit: number
  used: number
} {
  const limit = defaultDailyLimit()
  const now = Date.now()

  if (!dailySpend || now >= dailySpend.resetAt) {
    dailySpend = { count: 0, resetAt: now + DAY_MS }
  }

  return {
    allowed: dailySpend.count < limit,
    limit,
    used: dailySpend.count,
  }
}

export function recordSolvabilitySpend(): void {
  const now = Date.now()
  if (!dailySpend || now >= dailySpend.resetAt) {
    dailySpend = { count: 0, resetAt: now + DAY_MS }
  }
  dailySpend.count += 1
}

/** @internal Test helpers — not for production use. */
export const __solvabilitySpendTesting = {
  reset(): void {
    dailySpend = null
  },
  setDailySpend(count: number, resetAt: number): void {
    dailySpend = { count, resetAt }
  },
}
