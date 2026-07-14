import type { PlanTier } from "@/lib/plans"
import type { PppTier } from "@/lib/billing/ppp"
import { codingQuestionsEnabledForTier } from "@/lib/plans"
import type { Question, TestCase } from "@/lib/types"

/** Max auto-grade test cases per coding question (builder + AI). */
export const MAX_CODING_TEST_CASES = 5

export { codingQuestionsEnabledForTier }

export function clampTestCases(testCases: TestCase[] | undefined): TestCase[] {
  return (testCases ?? []).slice(0, MAX_CODING_TEST_CASES).map((tc) => ({
    input: tc.input ?? "",
    expected_output: tc.expected_output ?? "",
  }))
}

/** Coding is available on every plan, in every region. */
export function codingAllowedForOrg(
  _tier: PlanTier,
  _pppTier?: PppTier | null,
): boolean {
  return true
}

export type CodingBlockReason = "plan" | "ppp_floor"

export function codingStatusForOrg(
  _tier: PlanTier,
  _pppTier?: PppTier | null,
): {
  allowed: boolean
  detail: string
  showUpgrade: boolean
  reason?: CodingBlockReason
} {
  return { allowed: true, detail: "Coding enabled", showUpgrade: false }
}

export function newCodingQuestionBlockedMessage(
  _tier: PlanTier,
  _pppTier?: PppTier | null,
): string {
  return "Coding questions are available on your plan."
}

/**
 * Coding is available everywhere, so the only normalization needed is clamping
 * the number of auto-grade test cases per coding question.
 */
export function sanitizeQuestionsForPlan(
  incoming: Question[],
  _existing: Question[],
  _tier: PlanTier,
  _pppTier?: PppTier | null,
): Question[] {
  return incoming.map((q) =>
    q.type === "coding"
      ? { ...q, test_cases: clampTestCases(q.test_cases) }
      : q,
  )
}
