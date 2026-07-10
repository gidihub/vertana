import type { Candidate, Test } from "@/lib/types"

export interface TestFunnelStats {
  /** Per-candidate email invites sent (test_invites where is_share_link = false). */
  invited: number
  started: number
  completed: number
  shortlisted: number
  rejected: number
  hired: number
}

function dispositionCounts(candidates: Candidate[]) {
  return {
    shortlisted: candidates.filter((c) => c.disposition === "shortlisted").length,
    rejected: candidates.filter((c) => c.disposition === "rejected").length,
    hired: candidates.filter((c) => c.disposition === "hired").length,
  }
}

export function funnelForTest(
  candidates: Candidate[],
  inviteCount: number,
): TestFunnelStats {
  return {
    invited: inviteCount,
    started: candidates.filter((c) => c.started_at != null).length,
    completed: candidates.filter((c) => c.status === "submitted").length,
    ...dispositionCounts(candidates),
  }
}

/** Aggregate funnel across every assessment in the org. */
export function orgFunnel(
  candidates: Candidate[],
  inviteCounts: Record<string, number>,
): TestFunnelStats {
  const invited = Object.values(inviteCounts).reduce((sum, n) => sum + n, 0)
  return {
    invited,
    started: candidates.filter((c) => c.started_at != null).length,
    completed: candidates.filter((c) => c.status === "submitted").length,
    ...dispositionCounts(candidates),
  }
}

export function orgCompletionRate(candidates: Candidate[]): number {
  if (candidates.length === 0) return 0
  const completed = candidates.filter((c) => c.status === "submitted").length
  return Math.round((completed / candidates.length) * 100)
}

export function totalNeedsScoring(
  needsScoring: Record<string, number>,
): number {
  return Object.values(needsScoring).reduce((sum, n) => sum + n, 0)
}

export function pickDefaultTestId(tests: Test[]): string | null {
  if (tests.length === 0) return null
  const sorted = [...tests].sort((a, b) => {
    const aPinned = a.is_pinned ? 1 : 0
    const bPinned = b.is_pinned ? 1 : 0
    if (bPinned !== aPinned) return bPinned - aPinned
    if (a.status === "active" && b.status !== "active") return -1
    if (b.status === "active" && a.status !== "active") return 1
    return b.created_at.localeCompare(a.created_at)
  })
  return sorted[0]?.id ?? null
}

export const SCORE_BUCKETS = [
  { label: "0–20", min: 0, max: 20 },
  { label: "21–40", min: 21, max: 40 },
  { label: "41–60", min: 41, max: 60 },
  { label: "61–80", min: 61, max: 80 },
  { label: "81–100", min: 81, max: 100 },
] as const

export function scoreDistribution(candidates: Candidate[]) {
  const scored = candidates.filter(
    (c) => c.status === "submitted" && c.score !== null,
  )
  return SCORE_BUCKETS.map((b) => ({
    range: b.label,
    count: scored.filter(
      (c) => (c.score as number) >= b.min && (c.score as number) <= b.max,
    ).length,
  }))
}
