"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImageOff,
  Loader2,
  PlayCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { loadSessionPlayback, type SessionPlaybackModel } from "@/lib/store"
import { ANSWER_BUCKET_LABELS, type AnswerBucket } from "@/lib/candidates/report"
import {
  formatDurationMs,
  playbackQuestionPanelState,
  playbackSummaryCaption,
  segmentTone,
} from "@/lib/candidates/session-playback"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Timeline segment fill by outcome tone — incorrect stands out, rest are calm. */
const SEGMENT_FILL: Record<"danger" | "warning" | "neutral", string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  neutral: "bg-muted-foreground/40",
}

const RESULT_BADGE: Record<AnswerBucket, string> = {
  correct: "bg-success/15 text-success",
  incorrect: "bg-danger/15 text-danger",
  partial: "bg-muted text-foreground",
  needs_review: "bg-warning/15 text-warning-foreground",
  not_attempted: "bg-muted text-muted-foreground",
}

/**
 * "Session playback" — a diagnostic view pairing each proctoring camera frame
 * with the question the candidate was looking at when it was captured, plus a
 * timeline of where time was spent. Consent-first framing: this shows where a
 * candidate struggled, not an accusation. Signed camera URLs load lazily on
 * first expand; old attempts without a timing log never render this card (the
 * legacy camera slider covers them instead).
 */
export function SessionPlayback({
  testId,
  attemptId,
  availability,
  purgeDateLabel,
}: {
  testId: string
  attemptId: string
  availability: "available" | "purged" | "none"
  purgeDateLabel: string | null
}) {
  const [open, setOpen] = useState(false)
  const [model, setModel] = useState<SessionPlaybackModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && availability === "available" && model === null && !loading) {
      setError(null)
      setLoading(true)
      loadSessionPlayback(testId, attemptId)
        .then((m) => setModel(m))
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <PlayCircle className="size-4 text-muted-foreground" />
          Session playback
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          Where time was spent
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <p className="text-xs text-muted-foreground">
            A diagnostic view of where this candidate spent their time — each
            camera frame paired with the question that was on screen. Meant to
            show where they engaged or struggled, not to accuse.
          </p>

          {availability === "purged" ? (
            <p className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-4 text-sm text-muted-foreground">
              <ImageOff className="size-4" />
              Recordings deleted per retention policy
              {purgeDateLabel ? ` on ${purgeDateLabel}` : ""}.
            </p>
          ) : loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading playback…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : model ? (
            <PlaybackPlayer model={model} />
          ) : null}
        </div>
      )}
    </div>
  )
}

function PlaybackPlayer({ model }: { model: SessionPlaybackModel }) {
  const { frames, segments } = model
  const [index, setIndex] = useState(0)
  const segByQuestion = useMemo(
    () => new Map(segments.map((s) => [s.questionId, s])),
    [segments],
  )
  const totalMs = useMemo(
    () => segments.reduce((sum, s) => sum + s.totalMs, 0),
    [segments],
  )
  const caption = useMemo(() => playbackSummaryCaption(segments), [segments])

  if (frames.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageOff className="size-4" />
        No camera frames were captured for this attempt.
      </p>
    )
  }

  const clamped = Math.min(index, frames.length - 1)
  const frame = frames[clamped]
  const activeSegment = frame.questionId
    ? (segByQuestion.get(frame.questionId) ?? null)
    : null
  const panelState = playbackQuestionPanelState({
    hasTimeline: model.hasTimeline,
    hasActiveSegment: activeSegment !== null,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Left: camera frame */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Camera</span>
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            {frame.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frame.url}
                alt={`Frame ${clamped + 1}`}
                className="mx-auto max-h-[360px] w-full object-contain"
              />
            ) : (
              <div className="flex h-56 flex-col items-center justify-center gap-1 text-muted-foreground">
                <ImageOff className="size-6" />
                <span className="text-xs">This frame is no longer available.</span>
              </div>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground tabular-nums">
            Frame {clamped + 1} of {frames.length} ·{" "}
            {formatDateTime(frame.created_at)}
          </p>
        </div>

        {/* Right: the question active at this timestamp */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Question on screen
          </span>
          <div className="flex min-h-[240px] flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-3">
            {panelState === "question" && activeSegment ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Question {activeSegment.questionIndex + 1}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      RESULT_BADGE[activeSegment.bucket],
                    )}
                  >
                    {ANSWER_BUCKET_LABELS[activeSegment.bucket]}
                  </span>
                </div>
                <p className="text-sm font-medium text-pretty">
                  {activeSegment.prompt}
                </p>
                <span className="text-xs font-medium text-muted-foreground">
                  Answer when leaving this question
                </span>
                <div className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/50 px-3 py-2 text-sm">
                  {frame.answerAtExit ? (
                    frame.answerAtExit
                  ) : (
                    <span className="text-muted-foreground">
                      No answer recorded when leaving this question.
                    </span>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Clock className="size-3" />
                    {formatDurationMs(activeSegment.totalMs)} on question
                  </span>
                  <span className="tabular-nums">
                    {activeSegment.answerChangeCount} answer change
                    {activeSegment.answerChangeCount === 1 ? "" : "s"}
                  </span>
                </div>
              </>
            ) : panelState === "no_timing" ? (
              <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
                No question timing recorded for this session.
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
                Navigating between questions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared scrubber drives both panels */}
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="size-8 shrink-0"
          disabled={clamped === 0}
          onClick={() => setIndex(clamped - 1)}
          aria-label="Previous frame"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={clamped}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="flex-1 accent-[var(--primary)]"
          aria-label="Scrub session playback"
        />
        <Button
          size="icon"
          variant="outline"
          className="size-8 shrink-0"
          disabled={clamped === frames.length - 1}
          onClick={() => setIndex(clamped + 1)}
          aria-label="Next frame"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Question-segmented timeline: widths proportional to time on question */}
      {segments.length > 0 && totalMs > 0 && (
        <div className="flex flex-col gap-2">
          <div
            className="flex h-3 w-full overflow-hidden rounded-md bg-muted"
            role="group"
            aria-label="Time spent per question"
          >
            {segments.map((s) => {
              const isActive = activeSegment?.questionId === s.questionId
              return (
                <button
                  key={s.questionId}
                  type="button"
                  onClick={() =>
                    s.firstFrameIndex != null && setIndex(s.firstFrameIndex)
                  }
                  disabled={s.firstFrameIndex == null}
                  title={`Q${s.questionIndex + 1} · ${formatDurationMs(s.totalMs)} · ${ANSWER_BUCKET_LABELS[s.bucket]}`}
                  aria-label={`Jump to question ${s.questionIndex + 1}, ${formatDurationMs(s.totalMs)}, ${ANSWER_BUCKET_LABELS[s.bucket]}`}
                  className={cn(
                    "h-full min-w-[3px] transition-opacity hover:opacity-80 disabled:cursor-default",
                    SEGMENT_FILL[segmentTone(s.bucket)],
                    isActive && "ring-2 ring-inset ring-primary",
                  )}
                  style={{ width: `${(s.totalMs / totalMs) * 100}%` }}
                />
              )
            })}
          </div>
          {caption && (
            <p className="text-xs text-muted-foreground">{caption}</p>
          )}
        </div>
      )}
    </div>
  )
}
