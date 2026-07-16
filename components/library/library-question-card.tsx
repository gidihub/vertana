"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { linkClass } from "@/lib/design-tokens"
import {
  LibraryGrowthBadge,
  LibraryQuestionTagRow,
} from "@/components/library/library-badges"
import { LibraryQuestionMetaRow } from "@/components/library/library-question-meta"
import {
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
          "mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3",
          compact && "gap-x-3",
        )}
      >
        <LibraryQuestionMetaRow question={question} compact={compact} />
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
