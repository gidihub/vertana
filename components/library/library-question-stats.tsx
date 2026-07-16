"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { LIBRARY_STATS_MIN_ATTEMPTS } from "@/lib/db/library-stats"
import type { LibraryQuestionStats } from "@/lib/db/library-stats"
import { numericText } from "@/lib/design-tokens"
import { inferredDifficulty } from "@/lib/question-library/display"
import { toScoreDistribution } from "@/lib/question-library/score-distribution"
import { cn } from "@/lib/utils"
import type { Question, QuestionType } from "@/lib/types"

const statsCache = new Map<string, LibraryQuestionStats | null>()

function summaryLine(type: QuestionType, stats: LibraryQuestionStats): string {
  if (type === "coding" && stats.avgTestCasePassRate != null) {
    return `${stats.avgTestCasePassRate}% avg test cases passed`
  }
  if (stats.correctRate != null) {
    return `${stats.correctRate}% marked correct`
  }
  return ""
}

export function useLibraryQuestionStats(questionId: string) {
  const [stats, setStats] = useState<LibraryQuestionStats | null>(
    () => statsCache.get(questionId) ?? null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (statsCache.has(questionId)) {
      const cached = statsCache.get(questionId) ?? null
      setStats(cached)
      return cached
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/question-library/${questionId}/stats`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load stats")
      statsCache.set(questionId, data.stats)
      setStats(data.stats)
      return data.stats as LibraryQuestionStats
    } catch (err) {
      setStats(null)
      setError(err instanceof Error ? err.message : "Failed to load stats")
      return null
    } finally {
      setLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    setStats(statsCache.get(questionId) ?? null)
    setError(null)
    setLoading(false)
  }, [questionId])

  return { stats, loading, error, load }
}

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

export function LibraryScoreDistributionChart({
  stats,
  type,
  difficulty,
  compact = false,
}: {
  stats: LibraryQuestionStats
  type: QuestionType
  difficulty: string
  compact?: boolean
}) {
  const buckets = toScoreDistribution(
    stats.buckets,
    type,
    stats.attemptCount,
  )
  const maxPct = Math.max(...buckets.map((b) => b.pct), 1)

  return (
    <div className={cn("flex flex-col gap-2", compact ? "gap-1.5" : "gap-2")}>
      <div>
        <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
          Score distribution
        </p>
        <p className="text-xs text-muted-foreground">
          Compare with other {difficulty.toLowerCase()} questions using candidate
          outcomes.
        </p>
      </div>
      <div
        className={cn(
          "flex items-end justify-center gap-3",
          compact ? "h-24 px-1" : "h-28 px-2",
        )}
      >
        {buckets.map((bucket) => (
          <div
            key={bucket.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <div
              className={cn(
                "flex w-full items-end justify-center",
                compact ? "h-16" : "h-20",
              )}
            >
              <div
                className="w-full max-w-10 rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(8, (bucket.pct / maxPct) * 100)}%`,
                  backgroundColor: bucket.color,
                }}
                title={`${bucket.pct}%`}
              />
            </div>
            <span className="text-center text-[10px] leading-tight text-muted-foreground">
              {bucket.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-muted-foreground">
        % of candidates
      </p>
    </div>
  )
}

export function LibraryQuestionStatsPanel({
  question,
}: {
  question: Question
}) {
  const { stats, loading, error, load } = useLibraryQuestionStats(question.id)

  useEffect(() => {
    void load()
  }, [load])

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
          <LibraryScoreDistributionChart
            stats={stats}
            type={question.type}
            difficulty={inferredDifficulty(question)}
          />
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
