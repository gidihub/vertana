"use client"

import { useMemo } from "react"

import type { Candidate, Test } from "@/lib/types"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import { ScoreDistributionChart } from "@/components/results/score-distribution-chart"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

function minutesBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  return ms / 60000
}

export function ResultsSummary({
  test,
  candidates,
}: {
  test: Test
  candidates: Candidate[]
}) {
  const { completion, timing } = useMemo(() => {
    const submitted = candidates.filter((c) => c.status === "submitted")

    const times = submitted
      .map((c) => minutesBetween(c.started_at, c.submitted_at))
      .filter((m): m is number => m !== null)
    const avgMinutes =
      times.length > 0
        ? Math.round(times.reduce((sum, m) => sum + m, 0) / times.length)
        : null

    return {
      completion: {
        invited: candidates.length,
        completed: submitted.length,
        rate:
          candidates.length > 0
            ? Math.round((submitted.length / candidates.length) * 100)
            : 0,
      },
      timing: { avgMinutes, limit: test.time_limit_minutes },
    }
  }, [candidates, test.time_limit_minutes])

  const timePct =
    timing.avgMinutes !== null && timing.limit > 0
      ? Math.min(100, Math.round((timing.avgMinutes / timing.limit) * 100))
      : 0

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ScoreDistributionChart candidates={candidates} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion</CardTitle>
          <CardDescription>Progress across everyone invited.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-3xl font-semibold", numericText)}>
                {completion.completed}
              </span>
              <span className="text-sm text-muted-foreground">
                of {completion.invited} invited completed
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-3"
                style={{ width: `${completion.rate}%` }}
              />
            </div>
            <p className={cn("mt-1.5 text-xs text-muted-foreground", numericText)}>
              {completion.rate}% completion rate
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-3xl font-semibold", numericText)}>
                {timing.avgMinutes === null ? "—" : `${timing.avgMinutes}m`}
              </span>
              <span className="text-sm text-muted-foreground">
                avg time · {timing.limit}m limit
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${timePct}%` }}
              />
            </div>
            <p className={cn("mt-1.5 text-xs text-muted-foreground", numericText)}>
              {timing.avgMinutes === null
                ? "Timing appears once candidates submit"
                : `${timePct}% of the time limit used on average`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
