"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { Candidate, Test } from "@/lib/types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const SCORE_BUCKETS = [
  { label: "0–20", min: 0, max: 20 },
  { label: "21–40", min: 21, max: 40 },
  { label: "41–60", min: 41, max: 60 },
  { label: "61–80", min: 61, max: 80 },
  { label: "81–100", min: 81, max: 100 },
]

const chartConfig = {
  count: { label: "Candidates", color: "var(--chart-1)" },
} satisfies ChartConfig

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
  const { distribution, completion, timing } = useMemo(() => {
    const submitted = candidates.filter((c) => c.status === "submitted")
    const scored = submitted.filter((c) => c.score !== null)

    const distribution = SCORE_BUCKETS.map((b) => ({
      range: b.label,
      count: scored.filter(
        (c) => (c.score as number) >= b.min && (c.score as number) <= b.max,
      ).length,
    }))

    const times = submitted
      .map((c) => minutesBetween(c.started_at, c.submitted_at))
      .filter((m): m is number => m !== null)
    const avgMinutes =
      times.length > 0
        ? Math.round(times.reduce((sum, m) => sum + m, 0) / times.length)
        : null

    return {
      distribution,
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

  const hasScores = distribution.some((d) => d.count > 0)
  const timePct =
    timing.avgMinutes !== null && timing.limit > 0
      ? Math.min(100, Math.round((timing.avgMinutes / timing.limit) * 100))
      : 0

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Score distribution</CardTitle>
          <CardDescription>
            How graded candidates scored across the auto-graded questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasScores ? (
            <ChartContainer config={chartConfig} className="aspect-[16/7] w-full">
              <BarChart data={distribution} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="range"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex aspect-[16/7] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Scores appear here once auto-graded submissions come in.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion</CardTitle>
          <CardDescription>Progress across everyone invited.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums">
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
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
              {completion.rate}% completion rate
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums">
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
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
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
