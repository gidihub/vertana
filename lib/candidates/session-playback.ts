import {
  answerBucket,
  type AnswerBucket,
  type MediaAvailability,
} from "@/lib/candidates/report"

/**
 * "Session playback" pairs proctoring camera frames with the question the
 * candidate was actually looking at when the frame was captured. This module
 * holds the pure join/model-building logic (no DB or React deps) so it can be
 * unit-tested and shared by the server loader and the client player.
 *
 * Framing note: this is a diagnostic "where time was spent" view, not
 * surveillance — see the report copy. Nothing here infers intent.
 */

// ---------------------------------------------------------------------------
// Inputs (shapes the server maps rows into before building the model)
// ---------------------------------------------------------------------------

export interface PlaybackCameraFrame {
  id: string
  /** ISO timestamp the frame was captured. */
  created_at: string
  /** Short-lived signed URL, or null when the object could not be signed. */
  url: string | null
}

/** One `attempt_question_views` row: a single visit to a question. */
export interface QuestionViewWindow {
  question_id: string
  entered_at: string
  /** null only for an in-flight visit (never for a submitted attempt). */
  left_at: string | null
  /** Snapshot of the answer when the candidate left, shape `{ response }`. */
  answer_at_exit: unknown
  answer_change_count: number
}

/** Minimal graded-answer info needed for per-question result + prompt. */
export interface PlaybackAnswer {
  question_id: string
  prompt: string
  response: string
  is_correct: boolean | null
  points_awarded: number | null
  max_points: number
}

/** Question display order (0-based position within the test). */
export interface PlaybackQuestionOrder {
  question_id: string
  index: number
}

// ---------------------------------------------------------------------------
// Output model (consumed by the report player)
// ---------------------------------------------------------------------------

export interface SessionPlaybackFrame {
  id: string
  created_at: string
  url: string | null
  /** Question active at this frame's timestamp, or null when "between questions". */
  questionId: string | null
  /** Answer as it stood when the resolved visit ended, or null. */
  answerAtExit: string | null
}

export interface SessionPlaybackSegment {
  questionId: string
  /** 0-based question order; the UI renders this as `Q{questionIndex + 1}`. */
  questionIndex: number
  prompt: string
  bucket: AnswerBucket
  /** Total time on this question, summed across every visit (ms). */
  totalMs: number
  /** Answer edits, summed across every visit. */
  answerChangeCount: number
  /** Index into `frames` of this question's first frame, or null if none. */
  firstFrameIndex: number | null
}

export interface SessionPlaybackModel {
  frames: SessionPlaybackFrame[]
  segments: SessionPlaybackSegment[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMs(iso: string): number {
  return new Date(iso).getTime()
}

/** Extracts the stored answer string from an `answer_at_exit` jsonb value. */
function readAnswerSnapshot(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") return value
  if (typeof value === "object" && "response" in (value as Record<string, unknown>)) {
    const response = (value as { response?: unknown }).response
    return response == null ? null : String(response)
  }
  return null
}

/**
 * Resolves which question view window contains time `t` (ms since epoch).
 * A window is the finite range `[entered_at, left_at]`, inclusive. Only completed
 * windows (a finite left_at) are considered — an unclosed or malformed window is
 * skipped. When several windows match, the one entered latest wins (a later
 * revisit supersedes an earlier one). Returns null when `t` falls between
 * questions (after one window closed, before the next opened).
 */
export function resolveFrameWindow(
  windows: QuestionViewWindow[],
  t: number,
): QuestionViewWindow | null {
  let chosen: QuestionViewWindow | null = null
  let chosenEnter = -Infinity
  for (const w of windows) {
    if (w.left_at == null) continue
    const enter = toMs(w.entered_at)
    const leave = toMs(w.left_at)
    if (!Number.isFinite(enter) || !Number.isFinite(leave)) continue
    if (t >= enter && t <= leave && enter >= chosenEnter) {
      chosen = w
      chosenEnter = enter
    }
  }
  return chosen
}

function windowDurationMs(w: QuestionViewWindow): number {
  if (w.left_at == null) return 0
  const ms = toMs(w.left_at) - toMs(w.entered_at)
  return Number.isFinite(ms) && ms > 0 ? ms : 0
}

/**
 * Builds the full playback model: every camera frame resolved to its active
 * question, plus a per-question summary (time spent, edits, graded result, and
 * the index of its first frame) for the segmented timeline. Segments cover only
 * questions the candidate actually visited, ordered by question position.
 */
export function buildPlaybackModel(input: {
  frames: PlaybackCameraFrame[]
  windows: QuestionViewWindow[]
  answers: PlaybackAnswer[]
  order: PlaybackQuestionOrder[]
}): SessionPlaybackModel {
  const { frames: rawFrames, windows, answers, order } = input

  const frames: SessionPlaybackFrame[] = rawFrames
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((f) => {
      const w = resolveFrameWindow(windows, toMs(f.created_at))
      return {
        id: f.id,
        created_at: f.created_at,
        url: f.url,
        questionId: w?.question_id ?? null,
        answerAtExit: w ? readAnswerSnapshot(w.answer_at_exit) : null,
      }
    })

  const answerByQuestion = new Map(answers.map((a) => [a.question_id, a]))
  const indexByQuestion = new Map(order.map((o) => [o.question_id, o.index]))

  // Accumulate per-question time + edits across all visits.
  const totals = new Map<string, { totalMs: number; changes: number }>()
  for (const w of windows) {
    const acc = totals.get(w.question_id) ?? { totalMs: 0, changes: 0 }
    acc.totalMs += windowDurationMs(w)
    acc.changes += Math.max(0, w.answer_change_count)
    totals.set(w.question_id, acc)
  }

  // First frame index per question, for segment-click jumps.
  const firstFrameIndex = new Map<string, number>()
  frames.forEach((f, i) => {
    if (f.questionId && !firstFrameIndex.has(f.questionId)) {
      firstFrameIndex.set(f.questionId, i)
    }
  })

  const segments: SessionPlaybackSegment[] = [...totals.entries()]
    .map(([questionId, acc]) => {
      const answer = answerByQuestion.get(questionId)
      return {
        questionId,
        questionIndex: indexByQuestion.get(questionId) ?? Number.MAX_SAFE_INTEGER,
        prompt: answer?.prompt ?? "",
        bucket: answer ? answerBucket(answer) : "not_attempted",
        totalMs: acc.totalMs,
        answerChangeCount: acc.changes,
        firstFrameIndex: firstFrameIndex.get(questionId) ?? null,
      }
    })
    .sort((a, b) => a.questionIndex - b.questionIndex)

  return { frames, segments }
}

// ---------------------------------------------------------------------------
// Render-state decision + presentation helpers (pure, shared with the UI)
// ---------------------------------------------------------------------------

export type SessionPlaybackState = "player" | "purged" | "none"

/**
 * Decides what the Session playback card should render:
 * - `none`     → no timing log (old/in-flight session) OR no camera frames; the
 *                card is not shown and the legacy camera slider covers evidence.
 * - `purged`   → media deleted by the retention job; show the deleted-state note.
 * - `player`   → timing log + available camera frames; show the dual-panel player.
 */
export function sessionPlaybackState(input: {
  availability: MediaAvailability
  hasTimeline: boolean
  hasCameraFrames: boolean
}): SessionPlaybackState {
  if (!input.hasTimeline) return "none"
  if (input.availability === "purged") return "purged"
  if (input.availability === "available" && input.hasCameraFrames) return "player"
  return "none"
}

/** Human-readable duration, e.g. 192000 → "3m 12s", 8000 → "8s". */
export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

/** Coarse tone for a timeline segment, mapped from its graded outcome. */
export function segmentTone(bucket: AnswerBucket): "danger" | "warning" | "neutral" {
  if (bucket === "incorrect") return "danger"
  if (bucket === "needs_review") return "warning"
  return "neutral"
}

/**
 * One-line caption highlighting where the candidate spent the most time, e.g.
 * "Longest on Q4 (3m 12s), answered incorrectly." Returns null when there's no
 * measurable time to summarize.
 */
export function playbackSummaryCaption(
  segments: SessionPlaybackSegment[],
): string | null {
  const measured = segments.filter((s) => s.totalMs > 0)
  if (measured.length === 0) return null
  const longest = measured.reduce((a, b) => (b.totalMs > a.totalMs ? b : a))
  const outcome: Record<AnswerBucket, string> = {
    correct: "answered correctly",
    incorrect: "answered incorrectly",
    partial: "partially correct",
    needs_review: "needs review",
    not_attempted: "left unanswered",
  }
  return `Longest on Q${longest.questionIndex + 1} (${formatDurationMs(longest.totalMs)}), ${outcome[longest.bucket]}.`
}

// ---------------------------------------------------------------------------
// Candidate-side capture: per-question view tracker (best-effort telemetry)
// ---------------------------------------------------------------------------

export interface QuestionViewRecord {
  questionId: string
  enteredAt: string
  leftAt: string
  answer: string | null
  answerChangeCount: number
}

export interface QuestionViewTracker {
  /** Start a visit to `questionId` (resets the edit counter). */
  enter(questionId: string, atMs?: number): void
  /** Note an answer edit for the currently-active question. */
  recordAnswerChange(questionId: string): void
  /** Close the current visit and emit it. `answer` is the exit snapshot. */
  leaveCurrent(answer: string | null, atMs?: number): void
}

/**
 * Tracks the candidate's current question visit and emits a completed record
 * when they leave it. The emit is wrapped so a telemetry failure can NEVER
 * propagate into the candidate's flow — closing a visit (including the final one
 * on submit) must not be able to block answer submission.
 */
export function createQuestionViewTracker(
  emit: (record: QuestionViewRecord) => void,
): QuestionViewTracker {
  let currentId: string | null = null
  let enteredAtMs = 0
  let changeCount = 0

  return {
    enter(questionId, atMs = Date.now()) {
      currentId = questionId
      enteredAtMs = atMs
      changeCount = 0
    },
    recordAnswerChange(questionId) {
      if (questionId === currentId) changeCount += 1
    },
    leaveCurrent(answer, atMs = Date.now()) {
      if (currentId == null) return
      const record: QuestionViewRecord = {
        questionId: currentId,
        enteredAt: new Date(enteredAtMs).toISOString(),
        leftAt: new Date(atMs).toISOString(),
        answer,
        answerChangeCount: changeCount,
      }
      // Clear state first so a throwing emit still leaves the tracker consistent
      // and can't cause a duplicate emit on a subsequent cleanup call.
      currentId = null
      changeCount = 0
      try {
        emit(record)
      } catch {
        // Best-effort telemetry: swallow so submission is never blocked.
      }
    },
  }
}
