"use client"

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react"

import type { Delta } from "@/lib/dashboard/filters"
import { warningSurface, numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

/** Small "▲ 12.5% vs previous" pill. Up is good by default (invert for flags). */
export function DeltaPill({
  delta,
  invert = false,
  comparisonLabel = "vs previous period",
}: {
  delta: Delta
  invert?: boolean
  comparisonLabel?: string
}) {
  if (delta.direction === "flat" || delta.pct === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" />
        No change {comparisonLabel}
      </span>
    )
  }
  const isUp = delta.direction === "up"
  const positive = invert ? !isUp : isUp
  const Icon = isUp ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        positive ? "text-success" : "text-danger",
      )}
    >
      <Icon className="size-3" />
      <span className={numericText}>{delta.pct}%</span>
      <span className="ml-1 font-normal text-muted-foreground">
        {comparisonLabel}
      </span>
    </span>
  )
}

/**
 * KPI tile with an optional period-over-period delta and helper caption.
 * Shared across the analytics page and dashboard so both stay consistent.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  delta = null,
  invertDelta = false,
  comparisonLabel,
  caption,
  warning = false,
}: {
  label: string
  value: string | number
  icon?: LucideIcon
  delta?: Delta | null
  invertDelta?: boolean
  comparisonLabel?: string
  caption?: string
  warning?: boolean
}) {
  return (
    <Card className={warning ? cn("border", warningSurface) : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardDescription>{label}</CardDescription>
          {Icon ? (
            <Icon
              className={cn(
                "size-4 shrink-0",
                warning ? "text-amber-600" : "text-muted-foreground",
              )}
              aria-hidden
            />
          ) : null}
        </div>
        <CardTitle className={cn("text-3xl", numericText)}>{value}</CardTitle>
      </CardHeader>
      {delta || caption ? (
        <CardContent className="pt-0">
          {delta ? (
            <DeltaPill
              delta={delta}
              invert={invertDelta}
              comparisonLabel={comparisonLabel}
            />
          ) : caption ? (
            <span className="text-xs text-muted-foreground">{caption}</span>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}
