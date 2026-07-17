"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity } from "lucide-react"

import { candidateActivityMs } from "@/lib/dashboard/filters"
import { candidateDisplayName, candidateInitials } from "@/lib/candidate-name"
import type { Candidate, CandidateStatus } from "@/lib/types"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { CandidateStatusBadge } from "@/components/status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// "Invited" is intentionally omitted: invitees have no activity timestamp, so
// they never appear in this feed (rows without a timestamp are filtered out),
// which would make an "Invited" filter always empty.
const STATUS_ITEMS: Record<string, string> = {
  all: "All status",
  in_progress: "Started",
  submitted: "Completed",
}

function relativeTime(ms: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ms)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? "" : "s"} ago`
}

/**
 * Recent candidate activity feed with in-panel status and (optional)
 * assessment filters. Consumes an already time-range-filtered candidate list so
 * it stays consistent with the rest of the analytics view.
 */
export function RecentActivity({
  candidates,
  testTitles,
  showAssessmentFilter = true,
  limit = 8,
}: {
  candidates: Candidate[]
  testTitles: Record<string, string>
  showAssessmentFilter?: boolean
  limit?: number
}) {
  const [status, setStatus] = useState<string>("all")
  const [assessment, setAssessment] = useState<string>("all")

  // Refresh once a minute so relative labels ("5m ago") stay current while the
  // page stays open, without depending on unrelated re-renders.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const rows = useMemo(() => {
    return candidates
      .filter((c) => (status === "all" ? true : c.status === status))
      .filter((c) => (assessment === "all" ? true : c.test_id === assessment))
      .map((c) => ({ c, ms: candidateActivityMs(c) }))
      .filter((r): r is { c: Candidate; ms: number } => r.ms !== null)
      .sort((a, b) => b.ms - a.ms)
      .slice(0, limit)
  }, [candidates, status, assessment, limit])

  const assessmentItems = useMemo(
    () => ({ all: "All assessments", ...testTitles }),
    [testTitles],
  )

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-muted-foreground" aria-hidden />
              Recent activity
            </CardTitle>
            <CardDescription>
              Latest candidate progress in this period.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {showAssessmentFilter ? (
              <Select
                value={assessment}
                onValueChange={(v) => setAssessment(v || "all")}
                items={assessmentItems}
              >
                <SelectTrigger className="h-8 w-40 min-w-0 text-xs">
                  <SelectValue placeholder="Assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assessments</SelectItem>
                  {Object.entries(testTitles).map(([id, title]) => (
                    <SelectItem key={id} value={id}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Select
              value={status}
              onValueChange={(v) => setStatus(v || "all")}
              items={STATUS_ITEMS}
            >
              <SelectTrigger className="h-8 w-32 min-w-0 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No candidate activity matches these filters.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map(({ c, ms }) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {candidateInitials(c.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {candidateDisplayName(c.email)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {testTitles[c.test_id] ?? "Assessment"} · {relativeTime(ms, now)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <CandidateStatusBadge status={c.status as CandidateStatus} />
                  <span
                    className={cn(
                      "w-12 text-right text-sm font-medium",
                      numericText,
                      c.score === null && "text-muted-foreground",
                    )}
                  >
                    {c.score === null ? "—" : `${c.score}%`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
