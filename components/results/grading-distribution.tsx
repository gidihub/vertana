"use client"

import { useMemo } from "react"

import type { Candidate } from "@/lib/types"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

// Named grading bands (upper bound inclusive). Mirrors the qualitative tiers
// recruiters expect on assessment reports rather than a raw numeric histogram.
const BANDS = [
  { label: "Not suitable", range: "0–25%", max: 25, color: "bg-chart-5" },
  { label: "Beginner", range: "26–40%", max: 40, color: "bg-chart-4" },
  { label: "Intermediate", range: "41–60%", max: 60, color: "bg-chart-4" },
  { label: "Experienced", range: "61–75%", max: 75, color: "bg-chart-2" },
  { label: "Expert", range: "76–90%", max: 90, color: "bg-chart-3" },
  { label: "Proficient", range: "91–100%", max: 100, color: "bg-chart-3" },
] as const

export function GradingDistribution({
  candidates,
}: {
  candidates: Candidate[]
}) {
  const { bands, total } = useMemo(() => {
    const scored = candidates.filter(
      (c) => c.status === "submitted" && c.score !== null,
    )
    const counts = BANDS.map(() => 0)
    for (const c of scored) {
      const score = c.score as number
      const idx = BANDS.findIndex((b) => score <= b.max)
      counts[idx === -1 ? BANDS.length - 1 : idx] += 1
    }
    return { bands: counts, total: scored.length }
  }, [candidates])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grading distribution</CardTitle>
        <CardDescription>Score range breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {BANDS.map((band, i) => {
          const count = bands[i]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={band.label} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>
                  {band.label}{" "}
                  <span className="text-xs text-muted-foreground">
                    {band.range}
                  </span>
                </span>
                <span className={cn("text-muted-foreground", numericText)}>
                  {count === 0 ? "—" : count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", band.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {total === 0 && (
          <p className="text-xs text-muted-foreground">
            No scored submissions yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
