"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Clock, ChevronLeft, ChevronRight, Eye, Send } from "lucide-react"

import type { Question, Test } from "@/lib/types"
import {
  autosaveAnswer,
  reportTabSwitch,
  type ProctoringPolicyView,
} from "@/lib/store"
import {
  computeRemainingSeconds,
  effectiveTimeLimitMinutes,
  timingPolicyLabel,
} from "@/lib/test-timing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CodeEditorPanel } from "@/components/candidate/code-editor-panel"
import { ProctoringMonitor } from "@/components/candidate/proctoring-monitor"
import { isCameraProctoringEnabledClient } from "@/lib/proctoring/config"
import { codingResponseIsEmpty } from "@/lib/coding/response"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

const TYPE_LABELS: Record<Question["type"], string> = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  coding: "Coding",
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function TestRunner({
  test,
  token,
  attemptId,
  startedAt,
  initialAnswers = {},
  initialTabSwitches = 0,
  proctoringPolicy,
  onSubmit,
}: {
  test: Test
  token: string
  attemptId: string
  startedAt?: string
  initialAnswers?: Record<string, string>
  initialTabSwitches?: number
  proctoringPolicy?: ProctoringPolicyView | null
  onSubmit: (result: {
    answers: Record<string, string>
    tabSwitchCount: number
  }) => void
}) {
  const questions = useMemo(() => {
    const list = [...test.questions].sort((a, b) => a.position - b.position)
    if (!test.randomize_questions) return list
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [test])

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
  const allottedMinutes = effectiveTimeLimitMinutes(test)
  const [remaining, setRemaining] = useState(() =>
    computeRemainingSeconds(test, startedAt),
  )
  const [tabSwitches, setTabSwitches] = useState(initialTabSwitches)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const submittedRef = useRef(false)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const finish = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    onSubmit({ answers, tabSwitchCount: tabSwitches })
  }

  useEffect(() => {
    if (remaining <= 0) {
      finish()
      return
    }

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id)
          finish()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!test.requires_proctoring) return

    async function handleLeave() {
      try {
        const count = await reportTabSwitch(token, attemptId)
        setTabSwitches(count)
        setShowTabWarning(true)
      } catch {
        setTabSwitches((c) => c + 1)
        setShowTabWarning(true)
      }
    }

    function onVisibility() {
      if (document.hidden) void handleLeave()
    }

    function onBlur() {
      if (document.hidden) void handleLeave()
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("blur", onBlur)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("blur", onBlur)
    }
  }, [test.requires_proctoring, token, attemptId])

  const q = questions[current]
  const answered = questions.filter((item) => {
    const a = answers[item.id]
    if (item.type === "coding") return !codingResponseIsEmpty(a)
    return a !== undefined && a !== ""
  }).length
  const isLast = current === questions.length - 1
  const lowTime = remaining <= 60

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))

    clearTimeout(saveTimers.current[q.id])
    saveTimers.current[q.id] = setTimeout(() => {
      void autosaveAnswer({
        token,
        attemptId,
        questionId: q.id,
        response: value,
      })
    }, 500)
  }

  return (
    <div className="flex flex-col gap-4">
      {test.requires_proctoring &&
        isCameraProctoringEnabledClient() &&
        (proctoringPolicy?.maxSnapshots ?? 0) > 0 && (
          <ProctoringMonitor
            token={token}
            attemptId={attemptId}
            intervalMs={proctoringPolicy?.intervalMs}
            maxSnapshots={proctoringPolicy?.maxSnapshots}
          />
        )}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{test.title}</span>
          {test.requires_proctoring && (
            <Badge variant="secondary" className="gap-1">
              <Eye className="size-3" />
              Proctored
            </Badge>
          )}
          {test.forbid_ai_tools && (
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              No AI tools
            </Badge>
          )}
          {test.timing_policy !== "strict" && (
            <Badge variant="secondary">
              {timingPolicyLabel(test.timing_policy)} timing
            </Badge>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums",
              lowTime
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-foreground",
            )}
            role="timer"
            aria-live="off"
            aria-label={`${formatClock(remaining)} remaining of ${allottedMinutes} minutes allotted`}
          >
            <Clock className="size-4" />
            {formatClock(remaining)}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            of {allottedMinutes} min allotted
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((item, i) => {
          const isAnswered =
            item.type === "coding"
              ? !codingResponseIsEmpty(answers[item.id])
              : answers[item.id] !== undefined && answers[item.id] !== ""
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={i === current}
              className={cn(
                "size-8 rounded-md border text-xs font-medium transition-colors",
                i === current
                  ? "border-primary bg-primary text-primary-foreground"
                  : isAnswered
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Question {current + 1} of {questions.length}
            </span>
            <Badge variant="outline">{TYPE_LABELS[q.type]}</Badge>
          </div>
          <p className="text-lg font-medium text-pretty">{q.prompt}</p>
        </CardHeader>

        <CardContent>
          {q.type === "multiple_choice" && (
            <RadioGroup
              value={answers[q.id] ?? ""}
              onValueChange={(v) => setAnswer(String(v))}
              className="flex flex-col gap-2"
            >
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === String(i)
                return (
                  <Field
                    key={i}
                    orientation="horizontal"
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <RadioGroupItem value={String(i)} id={`${q.id}-${i}`} />
                    <FieldLabel
                      htmlFor={`${q.id}-${i}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {opt}
                    </FieldLabel>
                  </Field>
                )
              })}
            </RadioGroup>
          )}

          {q.type === "short_answer" && (
            <Textarea
              placeholder="Type your answer…"
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
            />
          )}

          {q.type === "coding" && (
            <CodeEditorPanel
              key={q.id}
              value={answers[q.id] ?? ""}
              onChange={setAnswer}
              token={token}
            />
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Button>
          {isLast ? (
            <Button onClick={() => setConfirmOpen(true)}>
              <Send data-icon="inline-start" />
              Submit
            </Button>
          ) : (
            <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
              Next
              <ChevronRight data-icon="inline-end" />
            </Button>
          )}
        </CardFooter>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {answered} of {questions.length} answered
      </p>

      <Dialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>You left the assessment window</DialogTitle>
            <DialogDescription>
              This assessment is proctored. Leaving the window has been recorded
              ({tabSwitches} time{tabSwitches === 1 ? "" : "s"}). Please stay on
              this page until you submit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button />}>Back to assessment</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Submit your assessment?</DialogTitle>
            <DialogDescription>
              You&apos;ve answered {answered} of {questions.length} questions.
              {answered < questions.length
                ? " Unanswered questions will be left blank."
                : ""}{" "}
              You can&apos;t make changes after submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Keep working
            </DialogClose>
            <Button onClick={finish}>
              <Send data-icon="inline-start" />
              Submit now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
