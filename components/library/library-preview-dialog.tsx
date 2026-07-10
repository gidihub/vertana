"use client"

import Link from "next/link"
import { useMemo, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { CodeEditorPanel } from "@/components/candidate/code-editor-panel"
import {
  LibraryQuestionTagRow,
  LibraryTypeMeta,
} from "@/components/library/library-badges"
import { LibraryQuestionStatsPanel } from "@/components/library/library-question-stats"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { linkClass } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  inferredDifficulty,
  libraryTitle,
  SOURCE_LABELS,
  TYPE_LABELS,
} from "@/lib/question-library/display"
import type { Question } from "@/lib/types"

function MetadataRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-ink">{children}</span>
    </div>
  )
}

function PreviewSidebar({ question }: { question: Question }) {
  return (
    <aside className="flex w-full flex-col gap-3 lg:w-[240px] lg:shrink-0">
      <div className="rounded-lg border border-sage-line/70 bg-card p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tags
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <LibraryQuestionTagRow question={question} />
        </div>
      </div>

      <div className="rounded-lg border border-sage-line/70 bg-card p-3">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Information
        </h3>
        <div className="flex flex-col gap-2.5">
          <MetadataRow label="Type">
            <LibraryTypeMeta type={question.type} />
          </MetadataRow>
          <MetadataRow label="Difficulty">
            {inferredDifficulty(question)}
          </MetadataRow>
          <MetadataRow label="Duration">
            {question.estimated_minutes
              ? `${question.estimated_minutes} min`
              : "—"}
          </MetadataRow>
          <MetadataRow label="Source">
            {SOURCE_LABELS[question.source ?? "library"]}
          </MetadataRow>
          {question.type === "coding" ? (
            <MetadataRow label="Test cases">
              {question.test_cases?.length ?? 0}
            </MetadataRow>
          ) : null}
        </div>
      </div>

      <LibraryQuestionStatsPanel question={question} />
    </aside>
  )
}

export function LibraryPreviewDialog({
  question,
  questions,
  open,
  codingEnabled,
  onOpenChange,
  onNavigate,
  onAdd,
}: {
  question: Question | null
  questions: Question[]
  open: boolean
  codingEnabled: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (question: Question) => void
  onAdd: () => void
}) {
  const nav = useMemo(() => {
    if (!question) return { index: -1, total: 0 }
    const index = questions.findIndex((q) => q.id === question.id)
    return { index, total: questions.length }
  }, [question, questions])

  if (!question) return null

  const isCoding = question.type === "coding"
  const codingLocked = isCoding && !codingEnabled
  const hasPrev = nav.index > 0
  const hasNext = nav.index >= 0 && nav.index < nav.total - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "!flex max-h-[min(90vh,900px)] w-full flex-col gap-0 overflow-hidden p-0",
          isCoding ? "sm:max-w-5xl" : "sm:max-w-2xl",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-4">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base leading-snug">
              {libraryTitle(question.prompt)}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Question preview: {TYPE_LABELS[question.type]},{" "}
              {inferredDifficulty(question)} difficulty
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-4">
              <p className="text-sm leading-relaxed text-foreground">
                {question.prompt}
              </p>

              {question.type === "multiple_choice" &&
              question.options.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {question.options.map((opt, i) => (
                    <li key={i}>{opt || `Option ${i + 1}`}</li>
                  ))}
                </ul>
              ) : null}

              {isCoding && codingEnabled ? (
                <CodeEditorPanel
                  key={question.id}
                  value=""
                  onChange={() => {}}
                  previewQuestionId={question.id}
                  previewTestCases={question.test_cases ?? []}
                />
              ) : null}

              {isCoding && codingLocked ? (
                <div className="rounded-lg border border-dashed border-sage-line bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  Live coding preview requires a{" "}
                  <Link href="/#pricing" className={linkClass}>
                    Growth plan
                  </Link>
                  . You can still read the prompt and metadata above.
                </div>
              ) : null}
            </div>

            <PreviewSidebar question={question} />
          </div>
        </div>

        <DialogFooter className="!mx-0 !mb-0 shrink-0 flex-col gap-3 border-t bg-muted/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => {
                const prev = questions[nav.index - 1]
                if (prev) onNavigate(prev)
              }}
            >
              <ChevronLeft data-icon="inline-start" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => {
                const next = questions[nav.index + 1]
                if (next) onNavigate(next)
              }}
            >
              Next
              <ChevronRight data-icon="inline-end" />
            </Button>
            {nav.total > 0 && nav.index >= 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {nav.index + 1} of {nav.total}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {codingLocked ? (
              <p className="text-sm text-muted-foreground">
                Requires{" "}
                <Link href="/#pricing" className={linkClass}>
                  Growth
                </Link>
              </p>
            ) : null}
            <Button
              onClick={() => {
                onAdd()
                onOpenChange(false)
              }}
              disabled={codingLocked}
            >
              <Plus data-icon="inline-start" />
              Add to test
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
