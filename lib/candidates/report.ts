import type { AttemptAnswerView } from "@/lib/store"

/**
 * Outcome bucket for a single answer, used by the score-breakdown legend and
 * per-question result labels. Derived from the graded fields — never a stored
 * enum — so the report always reflects the current grade.
 */
export type AnswerBucket =
  | "correct"
  | "incorrect"
  | "partial"
  | "needs_review"
  | "not_attempted"

export const ANSWER_BUCKET_LABELS: Record<AnswerBucket, string> = {
  correct: "Correct",
  incorrect: "Incorrect",
  partial: "Partial credit",
  needs_review: "Needs review",
  not_attempted: "Not attempted",
}

type BucketInput = Pick<
  AttemptAnswerView,
  "response" | "is_correct" | "points_awarded" | "max_points"
>

/** Whether a candidate left a question effectively blank. */
function isBlank(response: string): boolean {
  const trimmed = response.trim()
  if (!trimmed) return true
  // Coding answers are stored as JSON; treat an empty code body as blank.
  try {
    const parsed = JSON.parse(trimmed) as { code?: unknown }
    if (parsed && typeof parsed === "object" && "code" in parsed) {
      return String(parsed.code ?? "").trim() === ""
    }
  } catch {
    // Not JSON — a non-empty plain-text answer.
  }
  return false
}

export function answerBucket(answer: BucketInput): AnswerBucket {
  if (isBlank(answer.response)) return "not_attempted"
  if (answer.is_correct === true) return "correct"
  if (answer.is_correct === false) return "incorrect"
  // is_correct is null → not auto-graded (needs human/AI review).
  const points = answer.points_awarded
  if (points != null && points > 0) {
    return points >= answer.max_points ? "correct" : "partial"
  }
  return "needs_review"
}

/**
 * Counts each bucket across an attempt's answers. Only buckets that occur are
 * returned, so the legend naturally shows just the ones relevant to this test's
 * question mix.
 */
export function scoreBreakdown(
  answers: BucketInput[],
): { bucket: AnswerBucket; count: number }[] {
  const order: AnswerBucket[] = [
    "correct",
    "incorrect",
    "partial",
    "needs_review",
    "not_attempted",
  ]
  const counts = new Map<AnswerBucket, number>()
  for (const a of answers) {
    const b = answerBucket(a)
    counts.set(b, (counts.get(b) ?? 0) + 1)
  }
  return order
    .filter((b) => (counts.get(b) ?? 0) > 0)
    .map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 }))
}

/**
 * Fraction of the expected time below which a completion is "unusually fast".
 * Extracted as config so the threshold is tunable in one place.
 */
export const FAST_COMPLETION_RATIO = 0.25

export function completedUnusuallyFast(input: {
  startedAt: string | null
  submittedAt: string | null
  expectedMinutes: number
  ratio?: number
}): boolean {
  const { startedAt, submittedAt, expectedMinutes } = input
  const ratio = input.ratio ?? FAST_COMPLETION_RATIO
  if (!startedAt || !submittedAt || expectedMinutes <= 0) return false
  const ms = new Date(submittedAt).getTime() - new Date(startedAt).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return false
  const minutes = ms / 60000
  return minutes < expectedMinutes * ratio
}

export interface AttemptFlag {
  id: string
  label: string
}

/**
 * Triggered integrity/behaviour flags for an attempt, rendered inline in the
 * verdict header. Intentionally extensible — add new detectors here.
 */
export function attemptFlags(input: {
  startedAt: string | null
  submittedAt: string | null
  expectedMinutes: number
  tabSwitchCount: number
  tabSwitchThreshold: number
}): AttemptFlag[] {
  const flags: AttemptFlag[] = []

  if (
    completedUnusuallyFast({
      startedAt: input.startedAt,
      submittedAt: input.submittedAt,
      expectedMinutes: input.expectedMinutes,
    })
  ) {
    flags.push({ id: "fast_completion", label: "Completed unusually fast" })
  }

  if (input.tabSwitchCount >= input.tabSwitchThreshold) {
    flags.push({
      id: "tab_switches",
      label: `${input.tabSwitchCount} tab switch${input.tabSwitchCount === 1 ? "" : "es"}`,
    })
  }

  return flags
}

export interface McqAnswerRow {
  index: number
  text: string
  /** The candidate picked this option. */
  selected: boolean
  /** This option is the graded-correct answer. */
  correct: boolean
}

/**
 * Rows for rendering a multiple-choice answer: always marks the correct option,
 * and marks whichever option the candidate selected. Enables showing the
 * correct answer alongside a wrong selection, never "Incorrect" in isolation.
 */
export function mcqAnswerRows(
  options: string[],
  correctIndex: number | null,
  response: string,
): McqAnswerRow[] {
  const selectedIndex = response.trim() === "" ? null : Number(response)
  return options.map((text, index) => ({
    index,
    text,
    selected: selectedIndex === index,
    correct: correctIndex === index,
  }))
}

/**
 * Maps an accepted/overridden numeric score to the grade fields the write path
 * expects. Full marks → correct, zero → incorrect, anything between → partial
 * (is_correct left null so the legend can bucket it as "Partially").
 */
export function gradeFromScore(
  points: number,
  maxPoints: number,
): { isCorrect: boolean | null; pointsAwarded: number } {
  const clamped = Math.max(0, Math.min(maxPoints, Math.round(points)))
  if (clamped <= 0) return { isCorrect: false, pointsAwarded: 0 }
  if (clamped >= maxPoints) return { isCorrect: true, pointsAwarded: clamped }
  return { isCorrect: null, pointsAwarded: clamped }
}

export type MediaAvailability = "available" | "purged" | "none"

/**
 * Distinguishes "no media was ever captured" from "media existed but the
 * retention job has since deleted it", so the evidence panel can show a plain
 * retention-deleted message instead of a broken slider.
 */
export function mediaAvailability(input: {
  requiresProctoring: boolean
  hasMedia: boolean
  /**
   * Durable marker (persisted at capture time, surviving retention purge) that
   * media once existed for this attempt. Required to distinguish "purged" from
   * "never captured" — the elapsed retention window alone can't tell them apart.
   */
  everCaptured: boolean
}): MediaAvailability {
  if (input.hasMedia) return "available"
  if (!input.requiresProctoring) return "none"
  // Only report "purged" when durable evidence confirms media was captured (and
  // has since been deleted). Never infer purging from submittedAt/retentionDays.
  if (input.everCaptured) return "purged"
  return "none"
}

/** Date media was purged, for the retention-deleted message. */
export function mediaPurgeDate(
  submittedAt: string | null,
  retentionDays: number | null,
): Date | null {
  if (!submittedAt || !retentionDays || retentionDays <= 0) return null
  return new Date(
    new Date(submittedAt).getTime() + retentionDays * 24 * 60 * 60 * 1000,
  )
}
