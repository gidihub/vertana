"use client"

import { useMemo, useState } from "react"
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

import type { Candidate, Test } from "@/lib/types"
import { useStore, getConsent } from "@/lib/store"
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
import { useSimulatedLoad } from "@/lib/use-loading"
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

function toCsv(test: Test, candidates: Candidate[]): string {
  const header = [
    "Email",
    "Status",
    "Score (%)",
    "Tab switches",
    "Started",
    "Submitted",
    "Consent",
  ]
  const rows = candidates.map((c) => {
    const consent = getConsent(c.consent_id)
    return [
      c.email,
      c.status,
      c.score ?? "",
      c.tab_switch_count,
      c.started_at ?? "",
      c.submitted_at ?? "",
      consent ? `${consent.accepted ? "accepted" : "declined"} (${consent.consent_version})` : "n/a",
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
  const [selected, setSelected] = useState<Candidate | null>(null)
  const loading = useSimulatedLoad()

  const stats = useMemo(() => {
    const submitted = candidates.filter((c) => c.status === "submitted")
    const scored = submitted.filter((c) => c.score !== null)
    const avg =
      scored.length > 0
        ? Math.round(
            scored.reduce((sum, c) => sum + (c.score ?? 0), 0) / scored.length,
          )
        : null
    const flagged = candidates.filter((c) => c.tab_switch_count > 0).length
    return { total: candidates.length, submitted: submitted.length, avg, flagged }
  }, [candidates])

  if (!test) {
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
    if (candidates.length === 0) {
      toast.error("No results to export yet")
      return
    }
    const csv = toCsv(test!, candidates)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${test!.title.replace(/\s+/g, "-").toLowerCase()}-results.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Results exported")
  }

  function copyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    navigator.clipboard.writeText(`${origin}/t/${test!.token}`)
    toast.success("Candidate link copied")
  }

  const selectedConsent = selected ? getConsent(selected.consent_id) : undefined

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
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {test.title}
              </h1>
              <TestStatusBadge status={test.status} />
            </div>
            <p className="text-muted-foreground">Results & candidate activity</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyLink}>
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

          <ResultsSummary test={test} candidates={candidates} />

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
                    {candidates.map((c) => (
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="truncate">{selected?.email}</DialogTitle>
            <DialogDescription>Candidate submission detail</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-3 text-sm">
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
