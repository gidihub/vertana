import { createAdminClient } from "@/lib/supabase/admin"
import type { QuestionType } from "@/lib/types"

const MIN_ATTEMPTS = 5

export interface LibraryQuestionStats {
  attemptCount: number
  hasEnoughData: boolean
  /** MCQ / short answer: % marked correct among graded answers */
  correctRate: number | null
  /** Coding: average % of test cases passed per submission */
  avgTestCasePassRate: number | null
  /** Bucketed outcomes for chart */
  buckets: { label: string; count: number }[]
}

function outcomeBuckets(
  type: QuestionType,
  rows: Array<{
    is_correct: boolean | null
    test_cases_passed: number | null
    test_cases_total: number | null
  }>,
): { label: string; count: number }[] {
  if (type === "coding") {
    const labels = ["0%", "1–49%", "50–99%", "100%"]
    const counts = [0, 0, 0, 0]
    for (const row of rows) {
      const total = row.test_cases_total ?? 0
      const passed = row.test_cases_passed ?? 0
      if (total <= 0) continue
      const pct = (passed / total) * 100
      if (pct === 0) counts[0]++
      else if (pct < 50) counts[1]++
      else if (pct < 100) counts[2]++
      else counts[3]++
    }
    return labels.map((label, i) => ({ label, count: counts[i] }))
  }

  const correct = rows.filter((r) => r.is_correct === true).length
  const incorrect = rows.filter((r) => r.is_correct === false).length
  const ungraded = rows.filter((r) => r.is_correct == null).length
  return [
    { label: "Correct", count: correct },
    { label: "Incorrect", count: incorrect },
    { label: "Ungraded", count: ungraded },
  ].filter((b) => b.count > 0)
}

export async function loadLibraryQuestionStats(
  libraryQuestionId: string,
): Promise<LibraryQuestionStats | null> {
  const supabase = createAdminClient()

  const { data: libRow, error: libErr } = await supabase
    .from("questions")
    .select("id, prompt, type")
    .eq("id", libraryQuestionId)
    .eq("is_library_item", true)
    .maybeSingle()

  if (libErr || !libRow) return null

  const { data: clones } = await supabase
    .from("questions")
    .select("id")
    .eq("is_library_item", false)
    .eq("source", "library")
    .eq("type", libRow.type as string)
    .eq("prompt", libRow.prompt as string)

  const cloneIds = (clones ?? []).map((r) => r.id as string)
  if (!cloneIds.length) {
    return {
      attemptCount: 0,
      hasEnoughData: false,
      correctRate: null,
      avgTestCasePassRate: null,
      buckets: [],
    }
  }

  const { data: answers, error: ansErr } = await supabase
    .from("answers")
    .select(
      "is_correct, test_cases_passed, test_cases_total, attempt_id, attempts!inner(submitted_at)",
    )
    .in("question_id", cloneIds)

  if (ansErr) throw new Error(ansErr.message)

  const submitted = (answers ?? []).filter(
    (a) =>
      (a.attempts as { submitted_at: string | null } | null)?.submitted_at !=
      null,
  ) as Array<{
    is_correct: boolean | null
    test_cases_passed: number | null
    test_cases_total: number | null
  }>

  const attemptCount = submitted.length
  const hasEnoughData = attemptCount >= MIN_ATTEMPTS
  const type = libRow.type as QuestionType

  let correctRate: number | null = null
  let avgTestCasePassRate: number | null = null

  if (type === "coding") {
    const ratios = submitted
      .map((r) => {
        const total = r.test_cases_total ?? 0
        const passed = r.test_cases_passed ?? 0
        return total > 0 ? passed / total : null
      })
      .filter((r): r is number => r !== null)
    if (ratios.length > 0) {
      avgTestCasePassRate = Math.round(
        (ratios.reduce((sum, r) => sum + r, 0) / ratios.length) * 100,
      )
    }
  } else {
    const graded = submitted.filter((r) => r.is_correct != null)
    if (graded.length > 0) {
      const correct = graded.filter((r) => r.is_correct === true).length
      correctRate = Math.round((correct / graded.length) * 100)
    }
  }

  return {
    attemptCount,
    hasEnoughData,
    correctRate,
    avgTestCasePassRate,
    buckets: hasEnoughData ? outcomeBuckets(type, submitted) : [],
  }
}

export const LIBRARY_STATS_MIN_ATTEMPTS = MIN_ATTEMPTS
