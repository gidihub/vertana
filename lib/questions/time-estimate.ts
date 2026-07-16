import type { Question, QuestionType } from "@/lib/types"

/** Fallback per-question minutes when a question has no `estimated_minutes`. */
const FALLBACK_MINUTES: Record<QuestionType, number> = {
  multiple_choice: 2,
  short_answer: 5,
  coding: 12,
}

/** Reading/thinking buffer added on top of the raw sum of per-question times. */
const BUFFER_RATIO = 0.15

/** Time limits are clamped to this range and rounded to this step (minutes). */
const MIN_MINUTES = 15
const MAX_MINUTES = 240
const ROUND_STEP = 5

export function questionMinutes(
  q: Pick<Question, "type" | "estimated_minutes">,
): number {
  const estimate = q.estimated_minutes
  if (typeof estimate === "number" && estimate > 0) return estimate
  return FALLBACK_MINUTES[q.type] ?? FALLBACK_MINUTES.short_answer
}

/**
 * Suggests a total time limit (minutes) from per-question estimates, adding a
 * buffer for reading/context switching, then rounding and clamping to a sane
 * range. Returns null when there are no questions to base an estimate on.
 */
export function suggestedTimeLimit(
  questions: Pick<Question, "type" | "estimated_minutes">[],
): number | null {
  if (questions.length === 0) return null

  const raw = questions.reduce((sum, q) => sum + questionMinutes(q), 0)
  const withBuffer = raw * (1 + BUFFER_RATIO)
  const rounded = Math.round(withBuffer / ROUND_STEP) * ROUND_STEP

  return Math.min(Math.max(rounded, MIN_MINUTES), MAX_MINUTES)
}
