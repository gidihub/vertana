"use client"

import Link from "next/link"
import { useMemo } from "react"

import { hasGradingGuidance } from "@/lib/ai/grade-prompt"
import {
  bundleCountByCategory,
  LIBRARY_BUNDLES,
} from "@/lib/question-library/bundles"
import { LIBRARY_CATEGORIES } from "@/lib/question-library/categories"
import { libraryTitle } from "@/lib/question-library/display"
import { fetchLibraryQuestions, useStore } from "@/lib/store"
import type { Question } from "@/lib/types"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

function lacksGradingGuidance(q: Question): boolean {
  if (q.type !== "short_answer") return false
  return !hasGradingGuidance({
    expected: q.correct_answer_exact,
    rubric: q.rubric,
    modelAnswer: q.model_answer,
  })
}

export function LibraryAdminPanel() {
  const org = useStore((db) => db.organization)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Question[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchLibraryQuestions()
      .then((q) => {
        if (!cancelled) setItems(q)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error((err as Error).message || "Could not load library")
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const gradingGaps = useMemo(
    () => items.filter(lacksGradingGuidance),
    [items],
  )

  const coverage = useMemo(() => {
    const bundleCounts = bundleCountByCategory()
    const leaves = LIBRARY_CATEGORIES.filter((c) => c.parent_id !== null)
    return leaves.map((leaf) => {
      const qs = items.filter(
        (q) => (q.category_id ?? q.library_category) === leaf.id,
      )
      const high = qs.filter((q) => q.ai_resistance === "high").length
      return {
        id: leaf.id,
        name: leaf.name,
        count: qs.length,
        bundles: bundleCounts[leaf.id] ?? 0,
        highPct: qs.length ? Math.round((high / qs.length) * 100) : 0,
      }
    })
  }, [items])

  if (!org) return null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Library health for {org.name} — grading gaps and bundle coverage.
        </p>
        <Link href="/library" className="text-sm font-medium text-pine underline">
          Back to library
        </Link>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading library…
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Coverage by leaf category</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium text-right">Questions</th>
                    <th className="px-3 py-2 font-medium text-right">Bundles</th>
                    <th className="px-3 py-2 font-medium text-right">High AI-res %</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.bundles}
                        {row.count >= 30 && row.bundles === 0 ? (
                          <span className="ml-1 text-xs text-amber-600">packaging gap</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.highPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {LIBRARY_BUNDLES.length} bundles across{" "}
              {Object.keys(bundleCountByCategory()).length} categories.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">
              Short-answer grading gaps ({gradingGaps.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Questions with no exact answer, rubric, or model answer — AI grading
              assist will refuse until one is added.
            </p>
            {gradingGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">None — all covered.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto rounded-lg border border-border divide-y divide-border text-sm">
                {gradingGaps.map((q) => (
                  <li key={q.id} className="px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {q.category_id ?? q.library_category ?? "—"}
                    </span>
                    <p className="mt-0.5 line-clamp-2">{libraryTitle(q.prompt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
