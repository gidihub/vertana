"use client"

import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { buildActivityTrend, type DateWindow } from "@/lib/dashboard/filters"
import type { Candidate } from "@/lib/types"
import { cn } from "@/lib/utils"
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  started: { label: "Started", color: "var(--chart-4)" },
  completed: { label: "Completed", color: "var(--chart-1)" },
} satisfies ChartConfig

/**
 * Assessments started vs completed over the selected window. Buckets daily, or
 * weekly for spans longer than ~6 weeks. Purely derived from candidate
 * timestamps already in the store.
 */
export function ActivityTrendChart({
  candidates,
  window,
  compact = false,
}: {
  candidates: Candidate[]
  window: DateWindow | null
  compact?: boolean
}) {
  const { points, bucket } = useMemo(
    () => buildActivityTrend(candidates, window),
    [candidates, window],
  )

  const hasActivity = points.some((p) => p.started > 0 || p.completed > 0)

  return (
    <Card>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          Activity trend
        </CardTitle>
        <CardDescription>
          Assessments started vs completed
          {bucket === "week" ? ", by week" : ", by day"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasActivity ? (
          <ChartContainer
            config={chartConfig}
            className={compact ? "aspect-[2/1] w-full" : "aspect-[16/6] w-full"}
          >
            <AreaChart
              data={points}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillStarted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-started)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-started)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="started"
                type="monotone"
                stroke="var(--color-started)"
                fill="url(#fillStarted)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="completed"
                type="monotone"
                stroke="var(--color-completed)"
                fill="url(#fillCompleted)"
                strokeWidth={2}
                stackId="b"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground",
              compact ? "aspect-[2/1]" : "aspect-[16/6]",
            )}
          >
            No assessment activity in this period.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
