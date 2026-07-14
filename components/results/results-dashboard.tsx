"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  Users,
  Gauge,
  Flag,
  CheckCircle2,
  Link as LinkIcon,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"

import type { Candidate, ConsentRecord, Test } from "@/lib/types"
import { parseCodingResponse } from "@/lib/coding/response"
import { languageLabel } from "@/lib/coding/languages"
import {
  useStore,
  getConsent,
  loadTestResults,
  gradeAttempt,
  refreshStore,
  type AttemptAnswerView,
} from "@/lib/store"
import { formatDateTime } from "@/lib/format"
import { timingPolicyLabel } from "@/lib/test-timing"
import { funnelForTest } from "@/lib/dashboard/stats"
import { hasIntegrityConcern } from "@/lib/integrity"
import { cn } from "@/lib/utils"
import { numericText } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  TestStatusBadge,
  CandidateStatusBadge,
  PassFailBadge,
} from "@/components/status-badge"
import { evaluatePass } from "@/lib/passing"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { ResultsPreviewMockup } from "@/components/empty-mockups"
import { IntegrityConcernBadge } from "@/components/integrity-concern-badge"
import { CandidateInvitesPanel } from "@/components/results/candidate-invites-panel"
import { CandidateDispositionSelect } from "@/components/candidates/candidate-disposition"
import { ResultsSummary } from "@/components/results/results-summary"
import { ResultsFunnel } from "@/components/results/results-funnel"
import { ResultsTableSkeleton } from "@/components/loading-skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

function scoreTone(score: number | null) {
  if (score === null) return "text-muted-foreground"
  if (score >= 70) return "text-chart-3"
  if (score >= 40) return "text-chart-4"
  return "text-destructive"
}

function toCsv(
  test: Test,
  candidates: Candidate[],
  consents: Record<string, ConsentRecord>,
  answers: Record<string, AttemptAnswerView[]>,
): string {
  const passingScore = test?.passing_score ?? 70
  const questionHeaders = test.questions.map(
    (q, i) => `Q${i + 1}: ${q.prompt.replace(/"/g, '""')}`,
  )
  const header = [
    "Email",
    "Status",
    "Score (%)",
    "Result",
    "Tab switches",
    "Flagged",
    "Started",
    "Submitted",
    "Consent",
    ...questionHeaders,
  ]
  const rows = candidates.map((c) => {
    const consent = c.consent_id ? consents[c.consent_id] : undefined
    const attemptAnswers = answers[c.id] ?? []
    const answerCells = test.questions.map((q) => {
      const a = attemptAnswers.find((item) => item.question_id === q.id)
      return a?.response ?? ""
    })
    const result = evaluatePass(c.score, passingScore)
    return [
      c.email,
      c.status,
      c.score ?? "",
      result === null ? "" : result === "pass" ? "Pass" : "Fail",
      c.tab_switch_count,
      c.flagged ? "yes" : "no",
      c.started_at ?? "",
      c.submitted_at ?? "",
      consent
        ? `${consent.accepted ? "accepted" : "declined"} (${consent.consent_version})`
        : "n/a",
      ...answerCells,
    ]
  })
  return [header, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell)
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(","),
    )
    .join("\n")
}

export function ResultsDashboard({
  testId,
  embedded = false,
}: {
  testId: string
  embedded?: boolean
}) {
  const test = useStore((db) => db.tests.find((t) => t.id === testId))
  const candidates = useStore((db) =>
    db.candidates.filter((c) => c.test_id === testId),
  )
  const inviteCount = useStore((db) => db.inviteCounts[testId] ?? 0)
  const integrityThreshold = useStore(
    (db) => db.organization?.tab_switch_threshold ?? 3,
  )
  const consents = useStore((db) => db.consents)
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, AttemptAnswerView[]>>({})
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    void loadTestResults(testId)
      .then((data) => setAnswers(data.answers))
      .finally(() => setLoading(false))
  }, [testId])

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      if (a.score === null && b.score === null) {
        return (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "")
      }
      if (a.score === null) return 1
      if (b.score === null) return -1
      return b.score - a.score
    })
  }, [candidates])

  const stats = useMemo(() => {
    const submitted = candidates.filter((c) => c.status === "submitted")
    const scored = submitted.filter((c) => c.score !== null)
    const avg =
      scored.length > 0
        ? Math.round(
            scored.reduce((sum, c) => sum + (c.score ?? 0), 0) / scored.length,
          )
        : null
    const flagged = candidates.filter((c) =>
      hasIntegrityConcern(c.tab_switch_count, integrityThreshold),
    ).length
    const passingScore = test?.passing_score ?? 70
    const passed = scored.filter((c) => (c.score ?? 0) >= passingScore).length
    const passRate =
      scored.length > 0 ? Math.round((passed / scored.length) * 100) : null
    return {
      total: candidates.length,
      submitted: submitted.length,
      avg,
      flagged,
      passRate,
      scoredCount: scored.length,
    }
  }, [candidates, integrityThreshold, test?.passing_score])

  if (!test && !loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Test not found</EmptyTitle>
            <EmptyDescription>
              This test may have been deleted.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  function exportCsv() {
    if (!test || candidates.length === 0) {
      toast.error("No results to export yet")
      return
    }
    const csv = toCsv(test, sortedCandidates, consents, answers)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${test.title.replace(/\s+/g, "-").toLowerCase()}-results.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Results exported")
  }

  function copyLink() {
    if (!test?.token) return
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    navigator.clipboard.writeText(`${origin}/t/${test.token}`)
    toast.success("Candidate link copied")
  }

  const selectedAnswers = selected ? answers[selected.id] ?? [] : []
  const showSaveGrades = selectedAnswers.some(
    (a) => a.type === "short_answer" || a.type === "coding",
  )

  async function saveGrades() {
    if (!selected || !test) return
    setGrading(true)
    try {
      const grades = selectedAnswers
        .filter((a) => a.type === "short_answer" || a.type === "coding")
        .map((a) => ({
          questionId: a.question_id,
          isCorrect: a.is_correct,
          pointsAwarded: a.points_awarded ?? 0,
        }))
      const updated = await gradeAttempt({
        testId: test.id,
        attemptId: selected.id,
        grades,
      })
      setSelected(updated)
      const data = await loadTestResults(testId)
      setAnswers(data.answers)
      toast.success("Grades saved")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setGrading(false)
    }
  }

  const selectedConsent = selected?.consent_id
    ? consents[selected.consent_id] ?? getConsent(selected.consent_id)
    : undefined

  const statCards = [
    { label: "Candidates", value: stats.total, icon: Users },
    { label: "Submitted", value: stats.submitted, icon: ShieldCheck },
    {
      label: "Average score",
      value: stats.avg === null ? "—" : `${stats.avg}%`,
      icon: Gauge,
    },
    {
      label: "Pass rate",
      value: stats.passRate === null ? "—" : `${stats.passRate}%`,
      icon: CheckCircle2,
    },
    { label: "Integrity flags", value: stats.flagged, icon: Flag },
  ]

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6",
        !embedded && "mx-auto max-w-5xl px-4 py-8",
      )}
    >
      <div className="flex flex-col gap-4">
        {!embedded && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-muted-foreground"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to tests
          </Button>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {!embedded && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-sans text-2xl font-semibold tracking-tight text-balance text-ink">
                    {test?.title ?? "Loading…"}
                  </h1>
                  {test && <TestStatusBadge status={test.status} />}
                  {test?.forbid_ai_tools && (
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      AI tools: not permitted
                    </Badge>
                  )}
                  {test && test.timing_policy !== "normal" && (
                    <Badge variant="secondary">
                      {timingPolicyLabel(test.timing_policy)} timing
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">Results & candidate activity</p>
              </>
            )}
            {embedded && test && (
              <div className="flex flex-wrap items-center gap-2">
                <TestStatusBadge status={test.status} />
                {test.forbid_ai_tools && (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    AI tools: not permitted
                  </Badge>
                )}
                {test.timing_policy !== "normal" && (
                  <Badge variant="secondary">
                    {timingPolicyLabel(test.timing_policy)} timing
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyLink} disabled={!test?.token}>
              <LinkIcon data-icon="inline-start" />
              Copy link
            </Button>
            <Button onClick={exportCsv}>
              <Download data-icon="inline-start" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="size-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsTableSkeleton />
            </CardContent>
          </Card>
        </>
      ) : candidates.length === 0 ? (
        <>
          {test && (
            <CandidateInvitesPanel
              test={test}
              onInvitesChange={() => void refreshStore()}
            />
          )}
          {test && (
            <ResultsFunnel
              stats={funnelForTest(candidates, inviteCount)}
              description="Email invites sent → started → completed for this assessment."
              usesShareLink={test.status === "active"}
            />
          )}
          <Empty className="rounded-xl border border-dashed border-border py-10">
            <EmptyHeader>
              <EmptyMedia>
                <ResultsPreviewMockup />
              </EmptyMedia>
              <EmptyTitle className="text-base">No results yet</EmptyTitle>
              <EmptyDescription>
                Scores appear once candidates start. Send email invites above or
                copy the shared link for open distribution.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/tests/${testId}/edit`} />}
              >
                <Pencil data-icon="inline-start" />
                Edit test
              </Button>
            </EmptyContent>
          </Empty>
        </>
      ) : (
        <>
          {test && (
            <CandidateInvitesPanel
              test={test}
              onInvitesChange={() => void refreshStore()}
            />
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <s.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className={cn("text-2xl font-semibold", numericText)}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {test && (
            <ResultsFunnel
              stats={funnelForTest(candidates, inviteCount)}
              description="Email invites sent → started → completed for this assessment."
              usesShareLink={test.status === "active"}
            />
          )}

          {test && (
            <ResultsSummary
              test={test}
              candidates={candidates}
              inviteCount={inviteCount}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disposition</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Integrity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCandidates.map((c) => (
                      <TableRow
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium">{c.email}</TableCell>
                        <TableCell>
                          <CandidateStatusBadge status={c.status} />
                        </TableCell>
                        <TableCell>
                          <CandidateDispositionSelect
                            candidate={c}
                            compact
                            onUpdated={(updated) => {
                              if (selected?.id === updated.id) {
                                setSelected(updated)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            numericText,
                            scoreTone(c.score),
                          )}
                        >
                          {c.score === null ? "—" : `${c.score}%`}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const result = evaluatePass(
                              c.score,
                              test?.passing_score ?? 70,
                            )
                            return result ? (
                              <PassFailBadge result={result} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(c.submitted_at)}
                        </TableCell>
                        <TableCell>
                          {hasIntegrityConcern(c.tab_switch_count, integrityThreshold) ? (
                            <IntegrityConcernBadge compact />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="truncate">{selected?.email}</DialogTitle>
            <DialogDescription>Candidate submission detail</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto text-sm">
              {hasIntegrityConcern(selected.tab_switch_count, integrityThreshold) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                  <IntegrityConcernBadge />
                  <p className="text-xs text-muted-foreground">
                    This candidate left the assessment window{" "}
                    {selected.tab_switch_count} time
                    {selected.tab_switch_count === 1 ? "" : "s"} during
                    proctoring. Review their answers before making a decision.
                  </p>
                </div>
              )}
              <DetailRow label="Status">
                <CandidateStatusBadge status={selected.status} />
              </DetailRow>
              <Separator />
              <DetailRow label="Disposition">
                <CandidateDispositionSelect
                  candidate={selected}
                  onUpdated={setSelected}
                />
              </DetailRow>
              <Separator />
              <DetailRow label="Score">
                <span className={cn("font-semibold", scoreTone(selected.score))}>
                  {selected.score === null ? "Pending review" : `${selected.score}%`}
                </span>
              </DetailRow>
              <Separator />
              <DetailRow label="Result">
                {(() => {
                  const result = evaluatePass(
                    selected.score,
                    test?.passing_score ?? 70,
                  )
                  return result ? (
                    <PassFailBadge result={result} />
                  ) : (
                    <span className="text-muted-foreground">
                      Pending review
                    </span>
                  )
                })()}
              </DetailRow>
              <Separator />
              <DetailRow label="Passing score">
                <span className={numericText}>{test?.passing_score ?? 70}%</span>
              </DetailRow>
              <Separator />
              <DetailRow label="Integrity">
                {hasIntegrityConcern(selected.tab_switch_count, integrityThreshold) ? (
                  <IntegrityConcernBadge />
                ) : (
                  <span className="text-muted-foreground">No concerns</span>
                )}
              </DetailRow>
              <Separator />
              <DetailRow label="Tab switches">
                {selected.tab_switch_count}
              </DetailRow>
              <Separator />
              <DetailRow label="Started">
                {formatDateTime(selected.started_at)}
              </DetailRow>
              <Separator />
              <DetailRow label="Submitted">
                {formatDateTime(selected.submitted_at)}
              </DetailRow>
              <Separator />
              <DetailRow label="Consent">
                {selectedConsent ? (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" />
                    {selectedConsent.accepted ? "Accepted" : "Declined"} (
                    {selectedConsent.consent_version})
                  </span>
                ) : (
                  "Not proctored"
                )}
              </DetailRow>

              {selectedAnswers.length > 0 && (
                <>
                  <Separator />
                  <p className="font-medium">Answers</p>
                  <div className="flex flex-col gap-3">
                    {selectedAnswers.map((a, i) => (
                      <AnswerDetail
                        key={a.question_id}
                        answer={a}
                        index={i}
                        onGrade={(questionId, isCorrect, points) => {
                          setAnswers((prev) => ({
                            ...prev,
                            [selected.id]: prev[selected.id].map((item) =>
                              item.question_id === questionId
                                ? {
                                    ...item,
                                    is_correct: isCorrect,
                                    points_awarded: points,
                                  }
                                : item,
                            ),
                          }))
                        }}
                      />
                    ))}
                  </div>
                  {showSaveGrades && (
                    <Button
                      className="mt-2"
                      onClick={() => void saveGrades()}
                      disabled={grading}
                    >
                      Save grades
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AnswerDetail({
  answer: a,
  index: i,
  onGrade,
}: {
  answer: AttemptAnswerView
  index: number
  onGrade: (
    questionId: string,
    isCorrect: boolean | null,
    points: number,
  ) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const coding = a.type === "coding" ? parseCodingResponse(a.response) : null
  const autoGradedCoding = a.type === "coding" && (a.test_cases_total ?? 0) > 0

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">
        Q{i + 1} · {a.type.replace("_", " ")}
      </p>
      <p className="mt-1 font-medium">{a.prompt}</p>

      {autoGradedCoding && (
        <p className="mt-2 text-sm font-medium text-primary">
          {a.test_cases_passed ?? 0}/{a.test_cases_total ?? 0} test cases passed
          {a.points_awarded != null && (
            <span className="ml-2 font-normal text-muted-foreground">
              · {a.points_awarded}/{a.max_points} pts auto-scored
            </span>
          )}
        </p>
      )}

      {a.type === "coding" ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {expanded ? "Hide" : "Show"} submitted code & execution output
          </button>
          {expanded && (
            <div className="mt-2 flex flex-col gap-2">
              {coding && (
                <p className="text-xs text-muted-foreground">
                  Language: {languageLabel(coding.language)}
                </p>
              )}
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
                {coding?.code || "(no code)"}
              </pre>
              {a.execution_output && (
                <>
                  <p className="text-xs font-medium text-muted-foreground">
                    Execution output
                    {a.execution_status ? ` (${a.execution_status})` : ""}
                  </p>
                  <pre className="max-h-48 overflow-auto rounded-md border border-border p-3 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
                    {a.execution_output}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
          {a.response || "(no answer)"}
        </p>
      )}

      {a.type === "coding" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Override score:</span>
          <Button
            size="sm"
            variant={a.is_correct === true ? "default" : "outline"}
            onClick={() => onGrade(a.question_id, true, a.max_points)}
          >
            Full credit ({a.max_points} pts)
          </Button>
          <Button
            size="sm"
            variant={a.is_correct === false ? "destructive" : "outline"}
            onClick={() => onGrade(a.question_id, false, 0)}
          >
            Zero
          </Button>
        </div>
      )}

      {a.type === "short_answer" && a.is_correct === null && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={a.is_correct === true ? "default" : "outline"}
            onClick={() => onGrade(a.question_id, true, a.max_points)}
          >
            Correct ({a.max_points} pts)
          </Button>
          <Button
            size="sm"
            variant={a.is_correct === false ? "destructive" : "outline"}
            onClick={() => onGrade(a.question_id, false, 0)}
          >
            Incorrect
          </Button>
        </div>
      )}

      {a.is_correct !== null && (
        <p className="mt-2 text-xs text-muted-foreground">
          {a.points_awarded ?? 0}/{a.max_points} points
        </p>
      )}
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  )
}
