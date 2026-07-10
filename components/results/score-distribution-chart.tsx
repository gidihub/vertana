"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { scoreDistribution } from "@/lib/dashboard/stats"
import type { Candidate } from "@/lib/types"
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

const chartConfig = {
  count: { label: "Candidates", color: "var(--chart-1)" },
} satisfies ChartConfig

export function ScoreDistributionChart({
  candidates,
  compact = false,
}: {
  candidates: Candidate[]
  compact?: boolean
}) {
  const distribution = useMemo(
    () => scoreDistribution(candidates),
    [candidates],
  )

  const hasScores = distribution.some((d) => d.count > 0)

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="text-base">Score distribution</CardTitle>
        <CardDescription>
          Bucketed scores for completed candidates (0–100%).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasScores ? (
          <ChartContainer
            config={chartConfig}
            className={compact ? "aspect-[2/1] w-full" : "aspect-[16/7] w-full"}
          >
            <BarChart
              data={distribution}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
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
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div
            className={
              compact
                ? "flex aspect-[2/1] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
                : "flex aspect-[16/7] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
            }
          >
            Scores appear once candidates submit.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
