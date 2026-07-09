"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { AiResistanceBadge } from "@/components/builder/ai-resistance-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { linkClass } from "@/lib/design-tokens"
import {
  inferredDifficulty,
  libraryTopics,
  TYPE_LABELS,
} from "@/lib/question-library/display"
import type { Question } from "@/lib/types"

export function LibraryPreviewDialog({
  question,
  open,
  codingEnabled,
  onOpenChange,
  onAdd,
}: {
  question: Question | null
  open: boolean
  codingEnabled: boolean
  onOpenChange: (open: boolean) => void
  onAdd: () => void
}) {
  if (!question) return null

  const codingLocked = question.type === "coding" && !codingEnabled
  const topics = libraryTopics(question)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left text-base leading-snug">
            {question.prompt.split(/(?<=[.?!])\s+/)[0] ?? question.prompt}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Question preview: {TYPE_LABELS[question.type]},{" "}
            {inferredDifficulty(question)} difficulty
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{TYPE_LABELS[question.type]}</Badge>
            <Badge variant="outline">{inferredDifficulty(question)}</Badge>
            {question.estimated_minutes ? (
              <Badge variant="outline">{question.estimated_minutes} min</Badge>
            ) : null}
            {question.ai_resistance ? (
              <AiResistanceBadge level={question.ai_resistance} compact />
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="border-pine/25 bg-pine/5 text-pine"
            >
              {t}
            </Badge>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-foreground">{question.prompt}</p>

        {question.type === "multiple_choice" && question.options.length > 0 ? (
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {question.options.map((opt, i) => (
              <li key={i}>{opt || `Option ${i + 1}`}</li>
            ))}
          </ul>
        ) : null}

        {question.type === "coding" && (question.test_cases?.length ?? 0) > 0 ? (
          <p className="text-xs text-muted-foreground">
            Includes {question.test_cases?.length} auto-grade test case
            {(question.test_cases?.length ?? 0) === 1 ? "" : "s"}.
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          {codingLocked ? (
            <p className="text-sm text-muted-foreground">
              Coding questions require a{" "}
              <Link href="/#pricing" className={linkClass}>
                Growth plan
              </Link>
              .
            </p>
          ) : (
            <span />
          )}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
