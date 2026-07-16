"use client"

import { useRef, useState, type ComponentType, type ReactNode } from "react"
import { Clock, Gauge } from "lucide-react"

import {
  LibraryScoreDistributionChart,
  useLibraryQuestionStats,
} from "@/components/library/library-question-stats"
import { LibraryTypeMeta } from "@/components/library/library-badges"
import { inferredDifficulty } from "@/lib/question-library/display"
import type { Question } from "@/lib/types"
import { cn } from "@/lib/utils"

function LibraryMetaLabel({
  icon: Icon,
  children,
  interactive = false,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  interactive?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        interactive && "cursor-help",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {children}
    </span>
  )
}

function LibraryDifficultyLabel({ question }: { question: Question }) {
  const difficulty = inferredDifficulty(question)
  const { stats, loading, load } = useLibraryQuestionStats(question.id)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasChart = stats?.hasEnoughData && stats.buckets.length > 0

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
    void load()
  }

  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <LibraryMetaLabel icon={Gauge} interactive={hasChart || loading}>
        <span
          className={cn(
            hasChart &&
              "border-b border-dotted border-muted-foreground/60",
          )}
        >
          {difficulty}
        </span>
      </LibraryMetaLabel>

      {open && hasChart && stats ? (
        <div
          className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg ring-1 ring-foreground/10"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <LibraryScoreDistributionChart
            stats={stats}
            type={question.type}
            difficulty={difficulty}
            compact
          />
        </div>
      ) : null}
    </div>
  )
}

export function LibraryQuestionMetaRow({
  question,
  compact = false,
}: {
  question: Question
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground",
        compact && "gap-x-3",
      )}
    >
      <LibraryDifficultyLabel question={question} />
      {question.estimated_minutes ? (
        <LibraryMetaLabel icon={Clock}>
          {question.estimated_minutes} min
        </LibraryMetaLabel>
      ) : null}
      <LibraryTypeMeta type={question.type} short />
    </div>
  )
}
