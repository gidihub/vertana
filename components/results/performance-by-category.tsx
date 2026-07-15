"use client"

import { useMemo } from "react"

import type { Test } from "@/lib/types"
import type { AttemptAnswerView } from "@/lib/store"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple choice",
  multiple_select: "Multiple select",
  short_answer: "Short answer",
  long_answer: "Written response",
  coding: "Coding",
  code: "Coding",
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim()
}

function scoreColor(pct: number): string {
  if (pct >= 75) return "bg-chart-3"
  if (pct >= 50) return "bg-chart-2"
  if (pct >= 30) return "bg-chart-4"
  return "bg-chart-5"
}

/**
 * Per-category performance: for each skill category (falling back to question
 * type), the average % of points earned across every graded answer. Gives
 * recruiters a "where do candidates struggle" view analogous to a per-section
 * score breakdown.
 */
export function PerformanceByCategory({
  test,
  answers,
}: {
  test: Test
  answers: Record<string, AttemptAnswerView[]>
}) {
  const rows = useMemo(() => {
    // question_id → { label }
    const categoryOf = new Map<string, string>()
    for (const q of test.questions) {
      const raw =
        (typeof q.library_category === "string" && q.library_category) ||
        TYPE_LABELS[q.type] ||
        titleCase(q.type)
      categoryOf.set(q.id, typeof raw === "string" ? titleCase(raw) : raw)
    }

    const agg = new Map<
      string,
      { awarded: number; possible: number; questions: Set<string> }
    >()

    for (const attemptAnswers of Object.values(answers)) {
      for (const a of attemptAnswers) {
        const label = categoryOf.get(a.question_id)
        if (!label) continue
        const entry =
          agg.get(label) ??
          { awarded: 0, possible: 0, questions: new Set<string>() }
        entry.awarded += a.points_awarded ?? 0
        entry.possible += a.max_points ?? 0
        entry.questions.add(a.question_id)
        agg.set(label, entry)
      }
    }

    return Array.from(agg.entries())
      .map(([label, e]) => ({
        label,
        questions: e.questions.size,
        pct: e.possible > 0 ? Math.round((e.awarded / e.possible) * 100) : 0,
      }))
      .sort((a, b) => a.pct - b.pct)
  }, [test.questions, answers])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance by category</CardTitle>
        <CardDescription>
          Average points earned per skill area across graded submissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No graded answers yet.
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">
                  {row.label}{" "}
                  <span className="text-xs text-muted-foreground">
                    · {row.questions} question{row.questions === 1 ? "" : "s"}
                  </span>
                </span>
                <span className={cn("font-semibold", numericText)}>
                  {row.pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", scoreColor(row.pct))}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
