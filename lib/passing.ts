import type { Candidate, Test } from "@/lib/types"

export type PassResult = "pass" | "fail" | null

/**
 * Determine whether a candidate passed a test, based on the test's required
 * passing score. Returns null when the candidate hasn't submitted or the
 * attempt isn't graded yet (score is null) — pass/fail is undefined until then.
 */
export function evaluatePass(
  score: number | null | undefined,
  passingScore: number,
): PassResult {
  if (score === null || score === undefined) return null
  return score >= passingScore ? "pass" : "fail"
}

export function candidatePassResult(
  candidate: Pick<Candidate, "score">,
  test: Pick<Test, "passing_score">,
): PassResult {
  return evaluatePass(candidate.score, test.passing_score)
}
