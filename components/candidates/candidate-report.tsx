import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import type { CandidateAttemptDetail, CandidateProfileData } from "@/lib/db/queries"
import { hasGradingGuidance } from "@/lib/ai/grade-prompt"
import type { Question } from "@/lib/types"
import { candidateDisplayName, candidateInitials } from "@/lib/candidate-name"
import { evaluatePass } from "@/lib/passing"
import { effectiveTimeLimitMinutes } from "@/lib/test-timing"
import { formatDateTime } from "@/lib/format"
import { numericText } from "@/lib/design-tokens"
import { parseCodingResponse } from "@/lib/coding/response"
import { languageLabel } from "@/lib/coding/languages"
import {
  ANSWER_BUCKET_LABELS,
  answerBucket,
  attemptFlags,
  mcqAnswerRows,
  mediaAvailability,
  mediaPurgeDate,
  scoreBreakdown,
  type AnswerBucket,
} from "@/lib/candidates/report"
import { parseUserAgent, formatOutsideTime } from "@/lib/proctoring/user-agent"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { CandidateStatusBadge } from "@/components/status-badge"
import { CandidateDispositionSelect } from "@/components/candidates/candidate-disposition"
import {
  LocalDateTime,
  ReportEmailButton,
  ReportPrintButton,
} from "@/components/candidates/report-toolbar"
import { AiGradeAssist } from "@/components/candidates/ai-grade-assist"
import { EvidencePanel } from "@/components/candidates/evidence-panel"
import { SessionPlayback } from "@/components/candidates/session-playback"

const TYPE_LABELS: Record<Question["type"], string> = {
  multiple_choice: "multiple choice",
  short_answer: "short answer",
  coding: "coding",
}

const bucketText: Record<AnswerBucket, string> = {
  correct: "text-success",
  incorrect: "text-danger",
  partial: "text-foreground",
  needs_review: "text-warning-foreground",
  not_attempted: "text-muted-foreground",
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return "—"
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

export function CandidateReport({
  email,
  profile,
  retentionDays,
  tabSwitchThreshold,
}: {
  email: string
  profile: CandidateProfileData
  retentionDays: number
  tabSwitchThreshold: number
}) {
  const attempts = profile.attempts

  const scored = attempts.filter((a) => a.candidate.score !== null)
  const avg =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, a) => sum + (a.candidate.score ?? 0), 0) /
            scored.length,
        )
      : null
  const summary = {
    assessments: new Set(attempts.map((a) => a.test.id)).size,
    completed: attempts.filter((a) => a.candidate.status === "submitted").length,
    avg,
    flagged: attempts.filter(
      (a) =>
        a.candidate.flagged ||
        attemptFlags({
          startedAt: a.candidate.started_at,
          submittedAt: a.candidate.submitted_at,
          expectedMinutes: effectiveTimeLimitMinutes(a.test),
          tabSwitchCount: a.candidate.tab_switch_count,
          tabSwitchThreshold,
        }).length > 0,
    ).length,
  }

  return (
    <div
      id="print-report"
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8"
    >
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground print:hidden"
        nativeButton={false}
        render={<Link href="/candidates" />}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to candidates
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
            {candidateInitials(email)}
          </span>
          <div className="flex min-w-0 flex-col">
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-ink">
              {candidateDisplayName(email)}
            </h1>
            <ReportEmailButton email={email} />
          </div>
        </div>
        {attempts.length > 0 && <ReportPrintButton />}
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No assessments found for this candidate.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Assessments", value: summary.assessments },
              { label: "Completed", value: summary.completed },
              {
                label: "Avg score",
                value: summary.avg === null ? "—" : `${summary.avg}%`,
              },
              { label: "Integrity flags", value: summary.flagged },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex flex-col gap-1 py-4">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <p className={cn("text-2xl font-semibold", numericText)}>
                    {s.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {attempts.map((attempt) => (
            <AttemptReportCard
              key={attempt.candidate.id}
              attempt={attempt}
              retentionDays={retentionDays}
              tabSwitchThreshold={tabSwitchThreshold}
            />
          ))}
        </>
      )}
    </div>
  )
}

function AttemptReportCard({
  attempt,
  retentionDays,
  tabSwitchThreshold,
}: {
  attempt: CandidateAttemptDetail
  retentionDays: number
  tabSwitchThreshold: number
}) {
  const { candidate, test, answers, consent, mediaSummary } = attempt
  const passingScore = test.passing_score ?? 70
  const pass = evaluatePass(candidate.score, passingScore)
  const expectedMinutes = effectiveTimeLimitMinutes(test)
  const derivedFlags = attemptFlags({
    startedAt: candidate.started_at,
    submittedAt: candidate.submitted_at,
    expectedMinutes,
    tabSwitchCount: candidate.tab_switch_count,
    tabSwitchThreshold,
  })
  // Merge derived flags with the persisted review state so an attempt that was
  // flagged (and stored as such) is never rendered as unflagged, even when no
  // derived detector currently fires.
  const flags =
    candidate.flagged && derivedFlags.length === 0
      ? [{ id: "flagged", label: "Flagged for review" }]
      : derivedFlags
  const breakdown = scoreBreakdown(answers)
  const questionsById = new Map(test.questions.map((q) => [q.id, q]))

  const availability = mediaAvailability({
    requiresProctoring: test.requires_proctoring,
    hasMedia: mediaSummary.total > 0,
    everCaptured: mediaSummary.everCaptured,
  })
  const purgeDate = mediaPurgeDate(candidate.submitted_at, retentionDays)

  const consentLabel = consent
    ? `${consent.accepted ? "Accepted" : "Declined"} (${consent.consent_version})`
    : "Not proctored"

  // Compact facts shown inline in the verdict header. `datetime` values are
  // rendered client-side (local timezone) to avoid hydration mismatches.
  const headerFacts: {
    label: string
    value?: string
    datetime?: string | null
  }[] = []
  if (consent) {
    headerFacts.push({ label: "Consent", value: consentLabel })
    headerFacts.push({ label: "Responded", datetime: consent.responded_at })
  }
  headerFacts.push({
    label: "Tab switches",
    value: String(candidate.tab_switch_count),
  })

  // Full integrity fact grid shown inside the Integrity & identity panel.
  type IntegrityFact = {
    label: string
    value: string
    tone?: "good" | "bad" | "neutral"
  }
  const integrityFacts: IntegrityFact[] = []
  if (consent) {
    integrityFacts.push({
      label: "Consent",
      value: consentLabel,
      tone: consent.accepted ? "good" : "bad",
    })
    integrityFacts.push({
      label: "Responded",
      value: formatDateTime(consent.responded_at),
    })
    if (consent.ip_address) {
      integrityFacts.push({ label: "IP address", value: consent.ip_address })
    }
  }
  integrityFacts.push({
    label: "Tab switches",
    value: String(candidate.tab_switch_count),
    tone: candidate.tab_switch_count > 0 ? "bad" : "good",
  })

  // Behavioral signals only exist for attempts captured with the newer
  // instrumentation — gate on user_agent so older attempts don't show
  // misleading "Yes" pills for signals that were never recorded.
  if (candidate.user_agent) {
    const fullscreenActive = (candidate.fullscreen_exits ?? 0) === 0
    integrityFacts.push({
      label: "Full-screen always active",
      value: fullscreenActive ? "Yes" : "No",
      tone: fullscreenActive ? "good" : "bad",
    })
    const oneAttempt = (candidate.resume_count ?? 0) === 0
    integrityFacts.push({
      label: "Completed in one attempt",
      value: oneAttempt ? "Yes" : "No",
      tone: oneAttempt ? "good" : "bad",
    })
    integrityFacts.push({
      label: "Mouse out",
      value: `${candidate.mouse_out_count ?? 0} times`,
    })
    integrityFacts.push({
      label: "Time outside window",
      value: formatOutsideTime(candidate.time_outside_ms ?? 0),
    })
    const dual = candidate.dual_screen
    integrityFacts.push({
      label: "No dual screen",
      value: dual === false ? "Yes" : dual === true ? "No" : "Unknown",
      tone: dual === false ? "good" : dual === true ? "bad" : "neutral",
    })
    const parsedUa = parseUserAgent(candidate.user_agent)
    integrityFacts.push({ label: "Device", value: parsedUa.device })
    integrityFacts.push({ label: "Browser", value: parsedUa.browser })
  }

  return (
    <Card className="print-avoid-break">
      <CardContent className="flex flex-col gap-5 py-6">
        {/* Verdict header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{test.title}</h2>
              <CandidateStatusBadge status={candidate.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted <LocalDateTime iso={candidate.submitted_at} /> ·{" "}
              {formatDuration(candidate.started_at, candidate.submitted_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <VerdictPill pass={pass} />
            <span
              className={cn(
                "text-3xl font-semibold",
                numericText,
                candidate.score === null && "text-muted-foreground",
              )}
            >
              {candidate.score === null ? "—" : `${candidate.score}%`}
            </span>
            <span className="text-xs text-muted-foreground">
              {passingScore}% needed to pass
            </span>
          </div>
        </div>

        {/* Facts row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          {headerFacts.map((f) => (
            <span key={f.label} className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{f.label}:</span>
              <span
                className={cn(
                  "font-medium",
                  f.label === "Consent" && consent?.accepted && "text-success",
                )}
              >
                {f.datetime !== undefined ? (
                  <LocalDateTime iso={f.datetime} />
                ) : (
                  f.value
                )}
              </span>
            </span>
          ))}
          {flags.map((flag) => (
            <span
              key={flag.id}
              className="flex items-center gap-1.5 rounded-md bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning-foreground"
            >
              {flag.label}
            </span>
          ))}
          <span className="ml-auto print:hidden">
            <CandidateDispositionSelect candidate={candidate} compact />
          </span>
        </div>

        {/* Score breakdown legend */}
        {breakdown.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {breakdown.map(({ bucket, count }) => (
              <div
                key={bucket}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5"
              >
                <span className={cn("text-base font-semibold", numericText, bucketText[bucket])}>
                  {count}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ANSWER_BUCKET_LABELS[bucket]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Answers */}
        {answers.length > 0 && (
          <div className="flex flex-col gap-3">
            <Separator />
            <span className="text-sm font-medium">Answers</span>
            {answers.map((a, i) => (
              <AnswerCard
                key={a.question_id}
                answer={a}
                index={i}
                question={questionsById.get(a.question_id)}
                testId={test.id}
                attemptId={candidate.id}
              />
            ))}
          </div>
        )}

        {/* Integrity & identity */}
        {test.requires_proctoring && (
          <EvidencePanel
            testId={test.id}
            attemptId={candidate.id}
            availability={availability}
            purgeDateLabel={purgeDate ? formatDateTime(purgeDate.toISOString()) : null}
            retentionNote={
              consent?.accepted
                ? `Consented · deletes in ${retentionDays} days`
                : `Retention ${retentionDays} days`
            }
            facts={integrityFacts}
          />
        )}

        {/* Session playback — the single session scrubber: each camera frame
            paired with the question on screen. Renders whenever camera frames
            exist (or were captured and later purged). Attempts with frames but
            no per-question timing log still scrub here, with the question panel
            showing a "no question timing" state. */}
        {test.requires_proctoring &&
          (mediaSummary.kinds.includes("camera") || availability === "purged") && (
          <SessionPlayback
            testId={test.id}
            attemptId={candidate.id}
            availability={availability}
            purgeDateLabel={
              purgeDate ? formatDateTime(purgeDate.toISOString()) : null
            }
          />
        )}
      </CardContent>
    </Card>
  )
}

function VerdictPill({ pass }: { pass: "pass" | "fail" | null }) {
  if (pass === null) {
    return (
      <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-semibold text-muted-foreground">
        Pending
      </span>
    )
  }
  return (
    <span
      className={cn(
        "rounded-full px-3 py-0.5 text-xs font-semibold",
        pass === "pass"
          ? "bg-success/15 text-success"
          : "bg-danger/15 text-danger",
      )}
    >
      {pass === "pass" ? "Pass" : "Fail"}
    </span>
  )
}

function AnswerCard({
  answer: a,
  index: i,
  question,
  testId,
  attemptId,
}: {
  answer: CandidateAttemptDetail["answers"][number]
  index: number
  question?: Question
  testId: string
  attemptId: string
}) {
  const bucket = answerBucket(a)
  const points = a.points_awarded ?? 0
  const aiResistant = question?.ai_resistance === "high"
  const coding = a.type === "coding" ? parseCodingResponse(a.response) : null
  const showAssist = a.type === "short_answer" && bucket === "needs_review"
  const gradingGuidance = hasGradingGuidance({
    expected: question?.correct_answer_exact,
    rubric: question?.rubric,
    modelAnswer: question?.model_answer,
  })

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Q{i + 1} · {TYPE_LABELS[a.type]}
          </span>
          {aiResistant && (
            <Badge className="bg-accent text-accent-foreground">AI-resistant</Badge>
          )}
        </div>
        <span className={cn("text-xs font-medium", bucketText[bucket])}>
          {ANSWER_BUCKET_LABELS[bucket]}
          <span className="ml-1 font-normal text-muted-foreground">
            · {points}/{a.max_points}
          </span>
        </span>
      </div>

      <p className="mt-1 font-medium">{a.prompt}</p>

      {a.type === "multiple_choice" && question ? (
        <McqAnswer question={question} response={a.response} />
      ) : a.type === "coding" ? (
        <>
          <details className="mt-2 print:hidden">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show submitted code
              {coding ? ` (${languageLabel(coding.language)})` : ""}
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
              {coding?.code || "(no code)"}
            </pre>
          </details>
          <div className="mt-2 hidden print:block">
            <span className="text-xs text-muted-foreground">
              Submitted code{coding ? ` (${languageLabel(coding.language)})` : ""}
            </span>
            <pre className="mt-1 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
              {coding?.code || "(no code)"}
            </pre>
          </div>
        </>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <p className="whitespace-pre-wrap text-muted-foreground">
            {a.response || "(no answer)"}
          </p>
          {question?.correct_answer_exact && (
            <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm">
              <span className="text-xs text-muted-foreground">Expected answer</span>
              <p className="text-foreground">{question.correct_answer_exact}</p>
            </div>
          )}
          {showAssist && (
            <AiGradeAssist
              testId={testId}
              attemptId={attemptId}
              questionId={a.question_id}
              maxPoints={a.max_points}
              gradingGuidance={gradingGuidance}
              initialScore={a.ai_suggested_points}
              initialRationale={a.ai_suggested_rationale}
            />
          )}
        </div>
      )}
    </div>
  )
}

function McqAnswer({
  question,
  response,
}: {
  question: Question
  response: string
}) {
  const rows = mcqAnswerRows(
    question.options,
    question.correct_option_index,
    response,
  ).filter((r) => r.selected || r.correct)
  const noSelection = response.trim() === ""

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {rows.map((row) => {
        const isWrongPick = row.selected && !row.correct
        return (
          <div
            key={row.index}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              row.correct
                ? "border-success/30 bg-success/10 text-foreground"
                : isWrongPick
                  ? "border-danger/30 bg-danger/10 text-foreground"
                  : "border-border",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "font-semibold",
                row.correct ? "text-success" : "text-danger",
              )}
            >
              {row.correct ? "✓" : "✕"}
            </span>
            <span className="flex-1">{row.text}</span>
            <span className="text-xs text-muted-foreground">
              {row.correct
                ? row.selected
                  ? "Correct · selected"
                  : "Correct answer"
                : "Candidate's answer"}
            </span>
          </div>
        )
      })}
      {noSelection && (
        <p className="text-xs text-muted-foreground">No answer selected.</p>
      )}
    </div>
  )
}
