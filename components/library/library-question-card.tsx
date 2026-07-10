"use client"

import Link from "next/link"
import { Clock, Gauge } from "lucide-react"

import { Button } from "@/components/ui/button"
import { linkClass } from "@/lib/design-tokens"
import {
  LibraryGrowthBadge,
  LibraryQuestionTagRow,
  LibraryTypeMeta,
} from "@/components/library/library-badges"
import {
  inferredDifficulty,
  librarySummary,
  libraryTitle,
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
  const difficulty = inferredDifficulty(question)

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <LibraryQuestionTagRow question={question} />
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
        <LibraryTypeMeta type={question.type} />
        <span className="flex-1" />
        {codingLocked ? <LibraryGrowthBadge /> : null}
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

export { LibraryFilterChip } from "@/components/library/library-badges"
