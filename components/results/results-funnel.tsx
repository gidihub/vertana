"use client"

import { useMemo } from "react"
import { Funnel } from "lucide-react"

import type { TestFunnelStats } from "@/lib/dashboard/stats"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { numericText } from "@/lib/design-tokens"

const STAGE_COLORS = [
  "bg-chart-1",
  "bg-chart-1",
  "bg-chart-1",
  "bg-chart-4",
  "bg-chart-3",
  "bg-chart-2",
  "bg-chart-5",
  "bg-pine",
] as const

export function ResultsFunnel({
  stats,
  description = "Email invites sent → started → completed → recruiter disposition for this assessment.",
  usesShareLink = false,
}: {
  stats: TestFunnelStats
  description?: string
  /** When true, a shared link is also active (not counted in Invited). */
  usesShareLink?: boolean
}) {
  const stages = useMemo(() => {
    const invited = Math.max(stats.invited, 1)
    const pctOfInvited = (value: number) =>
      stats.invited > 0 ? Math.round((value / invited) * 100) : 0

    const emailStages =
      stats.opened !== undefined && stats.clicked !== undefined
        ? [
            {
              label: "Opened",
              value: stats.opened,
              pct: pctOfInvited(stats.opened),
            },
            {
              label: "Clicked",
              value: stats.clicked,
              pct: pctOfInvited(stats.clicked),
            },
          ]
        : []

    return [
      { label: "Invited", value: stats.invited, pct: 100 },
      ...emailStages,
      { label: "Started", value: stats.started, pct: pctOfInvited(stats.started) },
      {
        label: "Completed",
        value: stats.completed,
        pct: pctOfInvited(stats.completed),
      },
      {
        label: "Shortlisted",
        value: stats.shortlisted,
        pct: pctOfInvited(stats.shortlisted),
      },
      {
        label: "Rejected",
        value: stats.rejected,
        pct: pctOfInvited(stats.rejected),
      },
      { label: "Hired", value: stats.hired, pct: pctOfInvited(stats.hired) },
    ]
  }, [stats])

  const scaleMax = Math.max(
    stats.invited,
    stats.started,
    stats.completed,
    stats.shortlisted,
    stats.rejected,
    stats.hired,
    1,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Funnel className="size-4 text-muted-foreground" aria-hidden />
          Candidate funnel
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {stages.map((stage, i) => (
          <div key={stage.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{stage.label}</span>
              <span className={cn("text-sm", numericText, "text-muted-foreground")}>
                {stage.value}
                {stats.invited > 0 ? (
                  <span className="ml-1.5 text-xs">({stage.pct}%)</span>
                ) : null}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  STAGE_COLORS[i],
                )}
                style={{
                  width: `${Math.round((stage.value / scaleMax) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
        {stats.invited === 0 ? (
          <p className="text-xs text-muted-foreground">
            No email invites sent yet.
            {usesShareLink
              ? " A shared link is active — use email invites above to track outreach in this funnel."
              : " Send email invites or publish the test to activate the shared link."}
          </p>
        ) : stats.started < stats.invited ? (
          <p className="text-xs text-muted-foreground">
            {stats.invited - stats.started} email invite
            {stats.invited - stats.started === 1 ? "" : "s"} not yet started.
            {usesShareLink
              ? " Candidates joining via the shared link are tracked under Started, not Invited."
              : ""}
          </p>
        ) : usesShareLink ? (
          <p className="text-xs text-muted-foreground">
            Shared link is also active — only email invites count toward Invited.
          </p>
        ) : null}
        {stats.completed > 0 &&
        stats.shortlisted + stats.rejected + stats.hired === 0 ? (
          <p className="text-xs text-muted-foreground">
            Set disposition on the Candidates page or in a candidate&apos;s
            detail view to populate Shortlisted, Rejected, and Hired.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
