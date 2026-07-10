"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { LIBRARY_STATS_MIN_ATTEMPTS } from "@/lib/db/library-stats"
import type { LibraryQuestionStats } from "@/lib/db/library-stats"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import type { Question, QuestionType } from "@/lib/types"

function StatBar({
  label,
  count,
  max,
}: {
  label: string
  count: number
  max: number
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(numericText, "font-medium text-ink")}>{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-pine transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function summaryLine(type: QuestionType, stats: LibraryQuestionStats): string {
  if (type === "coding" && stats.avgTestCasePassRate != null) {
    return `${stats.avgTestCasePassRate}% avg test cases passed`
  }
  if (stats.correctRate != null) {
    return `${stats.correctRate}% marked correct`
  }
  return ""
}

export function LibraryQuestionStatsPanel({
  question,
}: {
  question: Question
}) {
  const [stats, setStats] = useState<LibraryQuestionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetch(`/api/question-library/${question.id}/stats`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load stats")
        if (!cancelled) setStats(data.stats)
      })
      .catch((err) => {
        if (!cancelled) {
          setStats(null)
          setError(err instanceof Error ? err.message : "Failed to load stats")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [question.id])

  return (
    <div className="rounded-lg border border-sage-line/70 bg-card p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Candidate outcomes
      </h3>
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !stats || stats.attemptCount === 0 ? (
        <p className="text-sm text-muted-foreground">Not enough data yet</p>
      ) : !stats.hasEnoughData ? (
        <p className="text-sm text-muted-foreground">
          Not enough data yet ({stats.attemptCount}/{LIBRARY_STATS_MIN_ATTEMPTS}{" "}
          submissions)
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className={cn("text-sm font-medium text-ink", numericText)}>
            {stats.attemptCount} submission{stats.attemptCount === 1 ? "" : "s"}
          </p>
          {summaryLine(question.type, stats) ? (
            <p className="text-xs text-muted-foreground">
              {summaryLine(question.type, stats)}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {stats.buckets.map((b) => (
              <StatBar
                key={b.label}
                label={b.label}
                count={b.count}
                max={stats.attemptCount}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
