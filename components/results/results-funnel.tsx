"use client"

import { useMemo } from "react"

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

const STAGE_COLORS = ["bg-chart-1", "bg-chart-4", "bg-chart-3"] as const

export function ResultsFunnel({
  stats,
  description = "Invited → started → completed for this assessment.",
}: {
  stats: TestFunnelStats
  description?: string
}) {
  const stages = useMemo(() => {
    const invited = Math.max(stats.invited, 1)
    return [
      { label: "Invited", value: stats.invited, pct: 100 },
      {
        label: "Started",
        value: stats.started,
        pct: stats.invited > 0 ? Math.round((stats.started / invited) * 100) : 0,
      },
      {
        label: "Completed",
        value: stats.completed,
        pct:
          stats.invited > 0
            ? Math.round((stats.completed / invited) * 100)
            : 0,
      },
    ]
  }, [stats])

  const scaleMax = Math.max(stats.invited, 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Candidate funnel</CardTitle>
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
            No candidates yet — share the assessment link to start the funnel.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
