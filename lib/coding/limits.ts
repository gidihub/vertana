import type { PlanTier } from "@/lib/plans"
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

/**
 * On Free/Starter: keep existing coding questions unchanged, block new ones and
 * edits to existing coding questions. On Growth+: clamp test case count.
 */
export function sanitizeQuestionsForPlan(
  incoming: Question[],
  existing: Question[],
  tier: PlanTier,
): Question[] {
  const existingById = new Map(existing.map((q) => [q.id, q]))

  if (codingQuestionsEnabledForTier(tier)) {
    return incoming.map((q) =>
      q.type === "coding"
        ? { ...q, test_cases: clampTestCases(q.test_cases) }
        : q,
    )
  }

  return incoming.map((q) => {
    if (q.type !== "coding") return q

    const prev = existingById.get(q.id)
    if (prev?.type === "coding") {
      return prev
    }

    throw new Error(
      "Coding questions require a Growth plan or higher. Upgrade to add new coding questions.",
    )
  })
}
