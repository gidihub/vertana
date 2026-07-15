"use client"

import { useMemo, useState } from "react"
import { Trophy } from "lucide-react"

import type { Candidate, Test } from "@/lib/types"
import { candidateDisplayName, candidateInitials } from "@/lib/candidate-name"
import { evaluatePass } from "@/lib/passing"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import { PassFailBadge } from "@/components/status-badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

type Mode = "score" | "speed"

function durationSeconds(c: Candidate): number | null {
  if (!c.started_at || !c.submitted_at) return null
  const ms = new Date(c.submitted_at).getTime() - new Date(c.started_at).getTime()
  return ms > 0 ? Math.round(ms / 1000) : null
}

function formatDuration(sec: number | null): string {
  if (sec === null) return "—"
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

const RANK_STYLES = [
  "bg-[color-mix(in_oklch,var(--chart-4)_30%,transparent)] text-[color-mix(in_oklch,var(--chart-4)_60%,var(--foreground))]",
  "bg-muted text-muted-foreground",
  "bg-[color-mix(in_oklch,var(--chart-5)_22%,transparent)] text-[color-mix(in_oklch,var(--chart-5)_60%,var(--foreground))]",
]

export function TopPerformers({
  candidates,
  test,
}: {
  candidates: Candidate[]
  test: Test
}) {
  const [mode, setMode] = useState<Mode>("score")

  const ranked = useMemo(() => {
    const scored = candidates.filter(
      (c) => c.status === "submitted" && c.score !== null,
    )
    const sorted = [...scored].sort((a, b) => {
      if (mode === "speed") {
        // Fastest among strong performers: prioritise passing, then speed.
        const aDur = durationSeconds(a) ?? Number.MAX_SAFE_INTEGER
        const bDur = durationSeconds(b) ?? Number.MAX_SAFE_INTEGER
        if (aDur !== bDur) return aDur - bDur
        return (b.score ?? 0) - (a.score ?? 0)
      }
      if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0)
      // Tie-break by faster completion.
      return (
        (durationSeconds(a) ?? Number.MAX_SAFE_INTEGER) -
        (durationSeconds(b) ?? Number.MAX_SAFE_INTEGER)
      )
    })
    return sorted.slice(0, 5)
  }, [candidates, mode])

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <Trophy className="size-4 text-muted-foreground" />
            Top performers
          </CardTitle>
          <CardDescription>
            Best candidates, ranked by {mode === "score" ? "score" : "speed"}.
          </CardDescription>
        </div>
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          {(["score", "speed"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded px-2 py-1 capitalize transition-colors",
                mode === m
                  ? "bg-pine text-pine-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "score" ? "Overall" : "By speed"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ranked.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No completed submissions yet.
          </p>
        ) : (
          ranked.map((c, i) => {
            const pass = evaluatePass(c.score, test.passing_score ?? 70)
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    RANK_STYLES[i] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {candidateInitials(c.email)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {candidateDisplayName(c.email)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(durationSeconds(c))}
                  </span>
                </div>
                {pass && <PassFailBadge result={pass} />}
                <span className={cn("text-sm font-semibold", numericText)}>
                  {c.score}%
                </span>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
