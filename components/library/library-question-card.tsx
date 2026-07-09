"use client"

import Link from "next/link"
import {
  Clock,
  Gauge,
  Keyboard,
  Lock,
  X,
} from "lucide-react"

import { AiResistanceBadge } from "@/components/builder/ai-resistance-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { linkClass } from "@/lib/design-tokens"
import {
  inferredDifficulty,
  librarySummary,
  libraryTitle,
  libraryTopics,
  TYPE_LABELS,
} from "@/lib/question-library/display"
import type { Question } from "@/lib/types"
import { cn } from "@/lib/utils"

export function LibraryQuestionCard({
  question,
  codingEnabled,
  onPreview,
  onAdd,
  compact = false,
}: {
  question: Question
  codingEnabled: boolean
  onPreview: () => void
  onAdd: () => void
  compact?: boolean
}) {
  const codingLocked = question.type === "coding" && !codingEnabled
  const title = libraryTitle(question.prompt)
  const summary = librarySummary(question.prompt)
  const topics = libraryTopics(question)
  const difficulty = inferredDifficulty(question)

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {topics.map((topic) => (
          <Badge
            key={topic}
            variant="outline"
            className="border-pine/25 bg-pine/5 text-pine"
          >
            {topic}
          </Badge>
        ))}
        {codingLocked ? (
          <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
            <Lock className="size-3" />
            Growth
          </Badge>
        ) : null}
      </div>

      <h3 className="text-sm font-semibold leading-snug text-foreground">
        {title}
      </h3>
      {summary ? (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {summary}
        </p>
      ) : null}

      <div
        className={cn(
          "mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground",
          compact && "gap-x-3",
        )}
      >
        <span className="inline-flex items-center gap-1">
          <Gauge className="size-3.5" />
          {difficulty}
        </span>
        {question.estimated_minutes ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {question.estimated_minutes} min
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Keyboard className="size-3.5" />
          {TYPE_LABELS[question.type]}
        </span>
        {question.ai_resistance ? (
          <AiResistanceBadge level={question.ai_resistance} compact />
        ) : null}
        <span className="flex-1" />
        <Button type="button" variant="ghost" size="sm" onClick={onPreview}>
          Preview
        </Button>
        {codingLocked ? (
          <p className="w-full text-xs text-muted-foreground sm:w-auto sm:text-right">
            Coding on{" "}
            <Link href="/#pricing" className={linkClass}>
              Growth
            </Link>
          </p>
        ) : (
          <Button type="button" size="sm" onClick={onAdd}>
            Add to test
          </Button>
        )}
      </div>
    </article>
  )
}

export function LibraryFilterChip({
  label,
  active,
  onClick,
  onRemove,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-pine/30 bg-pine/10 text-pine"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
      {onRemove ? (
        <X
          className="size-3"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        />
      ) : null}
    </button>
  )
}
