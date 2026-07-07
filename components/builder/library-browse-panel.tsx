"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { LIBRARY_CATEGORIES } from "@/lib/question-library/seed-data"
import type { AiResistance, LibraryCategory, Question } from "@/lib/types"
import { fetchLibraryQuestions, uid } from "@/lib/store"
import { AiResistanceBadge } from "@/components/builder/ai-resistance-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const TYPE_LABELS = {
  multiple_choice: "MCQ",
  short_answer: "Short answer",
  coding: "Coding",
} as const

function libraryCopy(q: Question, testId: string, position: number): Question {
  return {
    id: uid(),
    test_id: testId,
    type: q.type,
    prompt: q.prompt,
    options: [...q.options],
    correct_option_index: q.correct_option_index,
    correct_answer_exact: q.correct_answer_exact ?? null,
    position,
    points: q.points ?? 1,
    ai_resistance: q.ai_resistance ?? "medium",
    source: "library",
    library_category: q.library_category,
    estimated_minutes: q.estimated_minutes,
  }
}

export function LibraryBrowsePanel({
  testId,
  onAdd,
}: {
  testId: string
  onAdd: (question: Question) => void
}) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Question[]>([])
  const [category, setCategory] = useState<LibraryCategory | "">("")
  const [search, setSearch] = useState("")
  const [resistance, setResistance] = useState<AiResistance | "">("")
  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchLibraryQuestions({ category, search, ai_resistance: resistance })
      .then((questions) => {
        if (!cancelled) setItems(questions)
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
  }, [category, search, resistance])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of items) {
      const cat = item.library_category ?? "other"
      map[cat] = (map[cat] ?? 0) + 1
    }
    return map
  }, [items])

  function handleAdd(q: Question) {
    onAdd(libraryCopy(q, testId, 0))
    toast.success("Question added to your test")
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-2 lg:w-44">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Categories
        </p>
        <button
          type="button"
          onClick={() => setCategory("")}
          className={cn(
            "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
            category === "" && "bg-muted font-medium text-foreground",
          )}
        >
          All roles
        </button>
        {LIBRARY_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
              category === cat.id && "bg-muted font-medium text-foreground",
            )}
          >
            {cat.label}
            {counts[cat.id] != null ? (
              <span className="ml-1 text-muted-foreground">({counts[cat.id]})</span>
            ) : null}
          </button>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search library…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={resistance || "all"}
            onValueChange={(v) =>
              setResistance(v === "all" ? "" : (v as AiResistance))
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="AI resistance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resistance</SelectItem>
              <SelectItem value="high">High first</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading library…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No library questions match your filters.
            </p>
            <p className="text-xs text-muted-foreground">
              Run migrations 003 and 004 in Supabase if the library is empty.
            </p>
          </div>
        ) : (
          <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
            {items.map((q) => {
              const open = previewId === q.id
              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-border bg-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 p-3 text-left"
                    onClick={() => setPreviewId(open ? null : q.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">
                        {q.prompt}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{TYPE_LABELS[q.type]}</Badge>
                        {q.library_category ? (
                          <Badge variant="outline">
                            {LIBRARY_CATEGORIES.find(
                              (c) => c.id === q.library_category,
                            )?.label ?? q.library_category}
                          </Badge>
                        ) : null}
                        {q.estimated_minutes ? (
                          <Badge variant="outline">{q.estimated_minutes} min</Badge>
                        ) : null}
                        <AiResistanceBadge
                          level={q.ai_resistance ?? "medium"}
                          compact
                        />
                      </div>
                    </div>
                  </button>
                  {open ? (
                    <div className="border-t border-border px-3 pb-3">
                      <p className="py-2 text-sm leading-relaxed text-muted-foreground">
                        {q.prompt}
                      </p>
                      {q.type === "multiple_choice" && q.options.length > 0 ? (
                        <ul className="mb-3 list-inside list-disc text-sm text-muted-foreground">
                          {q.options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      ) : null}
                      <Button size="sm" onClick={() => handleAdd(q)}>
                        <Plus data-icon="inline-start" />
                        Add to test
                      </Button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
