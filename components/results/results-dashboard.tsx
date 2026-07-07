"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  Users,
  Gauge,
  Flag,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import type { Candidate, ConsentRecord, Test } from "@/lib/types"
import {
  useStore,
  getConsent,
  loadTestResults,
  gradeAttempt,
  type AttemptAnswerView,
} from "@/lib/store"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TestStatusBadge, CandidateStatusBadge } from "@/components/status-badge"
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
import { ResultsSummary } from "@/components/results/results-summary"
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
  const questionHeaders = test.questions.map(
    (q, i) => `Q${i + 1}: ${q.prompt.replace(/"/g, '""')}`,
  )
  const header = [
    "Email",
    "Status",
    "Score (%)",
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
    return [
      c.email,
      c.status,
      c.score ?? "",
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

export function ResultsDashboard({ testId }: { testId: string }) {
  const test = useStore((db) => db.tests.find((t) => t.id === testId))
  const candidates = useStore((db) =>
    db.candidates.filter((c) => c.test_id === testId),
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
    const flagged = candidates.filter((c) => c.flagged || c.tab_switch_count > 0).length
    return { total: candidates.length, submitted: submitted.length, avg, flagged }
  }, [candidates])

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
  const needsReview = selectedAnswers.some(
    (a) =>
      (a.type === "short_answer" || a.type === "coding") &&
      a.is_correct === null,
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
    { label: "Flagged", value: stats.flagged, icon: Flag },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4">
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-balance text-ink">
                {test?.title ?? "Loading…"}
              </h1>
              {test && <TestStatusBadge status={test.status} />}
            </div>
            <p className="text-muted-foreground">Results & candidate activity</p>
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
        <Empty className="rounded-xl border border-dashed border-border py-10">
          <EmptyHeader>
            <EmptyMedia>
              <ResultsPreviewMockup />
            </EmptyMedia>
            <EmptyTitle className="text-base">No results yet</EmptyTitle>
            <EmptyDescription>
              Scores and activity appear here as soon as candidates start the
              test. Share the link below to invite your first candidate.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={copyLink}>
              <LinkIcon data-icon="inline-start" />
              Copy candidate link
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <s.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {test && <ResultsSummary test={test} candidates={candidates} />}

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
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Tab switches</TableHead>
                      <TableHead>Submitted</TableHead>
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
                        <TableCell
                          className={cn(
                            "text-right font-semibold tabular-nums",
                            scoreTone(c.score),
                          )}
                        >
                          {c.score === null ? "—" : `${c.score}%`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.tab_switch_count > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <Flag className="size-3" />
                              {c.tab_switch_count}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(c.submitted_at)}
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
              <DetailRow label="Status">
                <CandidateStatusBadge status={selected.status} />
              </DetailRow>
              <Separator />
              <DetailRow label="Score">
                <span className={cn("font-semibold", scoreTone(selected.score))}>
                  {selected.score === null ? "Pending review" : `${selected.score}%`}
                </span>
              </DetailRow>
              <Separator />
              <DetailRow label="Tab switches">
                {selected.tab_switch_count > 0 ? (
                  <Badge variant="secondary" className="gap-1">
                    <Flag className="size-3" />
                    {selected.tab_switch_count}
                  </Badge>
                ) : (
                  "None"
                )}
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
                      <div
                        key={a.question_id}
                        className="rounded-lg border border-border p-3"
                      >
                        <p className="text-xs text-muted-foreground">
                          Q{i + 1} · {a.type.replace("_", " ")}
                        </p>
                        <p className="mt-1 font-medium">{a.prompt}</p>
                        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                          {a.response || "(no answer)"}
                        </p>
                        {(a.type === "short_answer" || a.type === "coding") && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant={
                                a.is_correct === true ? "default" : "outline"
                              }
                              onClick={() => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [selected.id]: prev[selected.id].map((item) =>
                                    item.question_id === a.question_id
                                      ? {
                                          ...item,
                                          is_correct: true,
                                          points_awarded: item.max_points,
                                        }
                                      : item,
                                  ),
                                }))
                              }}
                            >
                              Correct ({a.max_points} pts)
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                a.is_correct === false ? "destructive" : "outline"
                              }
                              onClick={() => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [selected.id]: prev[selected.id].map((item) =>
                                    item.question_id === a.question_id
                                      ? {
                                          ...item,
                                          is_correct: false,
                                          points_awarded: 0,
                                        }
                                      : item,
                                  ),
                                }))
                              }}
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
                    ))}
                  </div>
                  {needsReview && (
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
