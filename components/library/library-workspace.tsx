"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { LibraryBundlesRow } from "@/components/library/library-bundles-row"
import { LibraryCategoryNav } from "@/components/library/library-category-nav"
import {
  LibraryFilterChip,
  LibraryQuestionCard,
} from "@/components/library/library-question-card"
import { LibraryPreviewDialog } from "@/components/library/library-preview-dialog"
import { AddToTestDialog } from "@/components/library/add-to-test-dialog"
import { libraryCopy } from "@/lib/question-library/copy"
import {
  bundlesForCategory,
  questionsForBundle,
  type LibraryBundle,
} from "@/lib/question-library/bundles"
import {
  APPLIED_APTITUDE_BUILDER_GUIDANCE,
  APPLIED_APTITUDE_LEAF_DESCRIPTIONS,
  APPLIED_APTITUDE_PARENT_DESCRIPTION,
  APPLIED_APTITUDE_PARENT_ID,
  isAppliedAptitudeCategory,
} from "@/lib/question-library/applied-aptitude"
import {
  countByCategoryTree,
  categoryLabel,
  inferredDifficulty,
  sortLibraryQuestions,
  type InferredDifficulty,
  type LibrarySort,
} from "@/lib/question-library/display"
import { fetchLibraryQuestions, useStore } from "@/lib/store"
import type { AiResistance, Question, QuestionSeniority, QuestionType } from "@/lib/types"
import { codingStatusForOrg } from "@/lib/coding/limits"
import { type PlanTier } from "@/lib/plans"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function LibraryWorkspace({
  mode = "page",
  testId,
  onAdd,
}: {
  mode?: "page" | "builder"
  testId?: string
  onAdd?: (questions: Question[]) => void
}) {
  const org = useStore((db) => db.organization)
  const tier = (org?.plan_tier ?? "free") as PlanTier
  const codingEnabled = codingStatusForOrg(tier, org?.ppp_tier ?? null).allowed

  const [loading, setLoading] = useState(true)
  const [allItems, setAllItems] = useState<Question[]>([])
  const [items, setItems] = useState<Question[]>([])

  const [category, setCategory] = useState<string | "">("")
  const [search, setSearch] = useState("")
  const [resistance, setResistance] = useState<AiResistance | "">("")
  const [difficultyFilter, setDifficultyFilter] = useState<InferredDifficulty | "">(
    "",
  )
  const [typeFilter, setTypeFilter] = useState<QuestionType | "">("")
  const [seniorityFilter, setSeniorityFilter] = useState<QuestionSeniority | "unspecified" | "">("")
  const [sort, setSort] = useState<LibrarySort>("recommended")

  const [preview, setPreview] = useState<Question | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [pendingAdd, setPendingAdd] = useState<Question[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchLibraryQuestions()
      .then((questions) => {
        if (!cancelled) setAllItems(questions)
      })
      .catch(() => {
        if (!cancelled) setAllItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  const categoryCounts = useMemo(() => countByCategoryTree(allItems), [allItems])

  const displayed = useMemo(() => {
    let list = items
    if (typeFilter) list = list.filter((q) => q.type === typeFilter)
    if (difficultyFilter) {
      list = list.filter((q) => inferredDifficulty(q) === difficultyFilter)
    }
    if (seniorityFilter === "unspecified") {
      list = list.filter((q) => !q.seniority)
    } else if (seniorityFilter) {
      list = list.filter((q) => q.seniority === seniorityFilter)
    }
    return sortLibraryQuestions(list, sort)
  }, [items, sort, typeFilter, difficultyFilter, seniorityFilter])

  const visibleBundles = useMemo(
    () => (category ? bundlesForCategory(category) : bundlesForCategory("")),
    [category],
  )

  const categoryDescription = useMemo(() => {
    if (!category) return null
    if (category === APPLIED_APTITUDE_PARENT_ID) {
      return APPLIED_APTITUDE_PARENT_DESCRIPTION
    }
    if (category in APPLIED_APTITUDE_LEAF_DESCRIPTIONS) {
      return APPLIED_APTITUDE_LEAF_DESCRIPTIONS[
        category as keyof typeof APPLIED_APTITUDE_LEAF_DESCRIPTIONS
      ]
    }
    return null
  }, [category])

  function openAddFlow(questions: Question[]) {
    if (mode === "builder" && testId && onAdd) {
      const eligible = questions.filter(
        (q) => codingEnabled || q.type !== "coding",
      )
      if (eligible.length === 0) {
        toast.error("Coding library questions require a Growth plan.")
        return
      }
      const copies = eligible.map((q) => libraryCopy(q, testId, 0))
      onAdd(copies)
      return
    }
    setPendingAdd(questions)
    setAddDialogOpen(true)
  }

  function handleUseBundle(bundle: LibraryBundle) {
    setCategory(bundle.category)
    const picked = questionsForBundle(bundle, allItems)
    if (picked.length === 0) {
      toast.error("No questions found for this bundle")
      return
    }
    openAddFlow(picked)
  }

  const activeFilters =
    (category ? 1 : 0) +
    (resistance ? 1 : 0) +
    (difficultyFilter ? 1 : 0) +
    (typeFilter ? 1 : 0) +
    (seniorityFilter ? 1 : 0) +
    (search.trim() ? 1 : 0)

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="w-full shrink-0 lg:sticky lg:top-[4.5rem] lg:z-10 lg:w-56 lg:max-h-[calc(100svh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain">
        <LibraryCategoryNav
          active={category}
          counts={categoryCounts}
          total={allItems.length}
          onSelect={setCategory}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions, topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => setSort((v as LibrarySort) ?? "recommended")}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="quickest">Shorter duration</SelectItem>
              <SelectItem value="longest">Longer duration</SelectItem>
              <SelectItem value="easier">Easier difficulty</SelectItem>
              <SelectItem value="harder">Harder difficulty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {category && !addDialogOpen ? (
            <LibraryFilterChip
              label={categoryLabel(category)}
              active
              onRemove={() => setCategory("")}
            />
          ) : null}
          <Select
            value={resistance || "all"}
            onValueChange={(v) =>
              setResistance(v === "all" ? "" : (v as AiResistance))
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-[8rem] border-dashed text-xs">
              <SelectValue placeholder="AI resistance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AI resistance</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={difficultyFilter || "all"}
            onValueChange={(v) =>
              setDifficultyFilter(
                v === "all" ? "" : (v as InferredDifficulty),
              )
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-[7rem] border-dashed text-xs">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulty</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter || "all"}
            onValueChange={(v) =>
              setTypeFilter(v === "all" ? "" : (v as QuestionType))
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-[7rem] border-dashed text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="multiple_choice">MCQ</SelectItem>
              <SelectItem value="short_answer">Short answer</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={seniorityFilter || "all"}
            onValueChange={(v) =>
              setSeniorityFilter(
                v === "all"
                  ? ""
                  : (v as QuestionSeniority | "unspecified"),
              )
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-[7rem] border-dashed text-xs">
              <SelectValue placeholder="Seniority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All seniority</SelectItem>
              <SelectItem value="unspecified">Unspecified</SelectItem>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="mid">Mid</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground tabular-nums">
            {displayed.length} question{displayed.length === 1 ? "" : "s"}
            {activeFilters > 0 ? ` · ${activeFilters} filter${activeFilters === 1 ? "" : "s"}` : ""}
          </span>
        </div>

        {categoryDescription ? (
          <p className="rounded-lg border border-sage-line/70 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {categoryDescription}
          </p>
        ) : null}

        {visibleBundles.length > 0 ? (
          <LibraryBundlesRow
            bundles={visibleBundles}
            onUseBundle={handleUseBundle}
          />
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading library…
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No library questions match your filters.
            </p>
            {mode === "builder" ? (
              <p className="text-xs text-muted-foreground">
                Run migrations 003 and 004 in Supabase if the library is empty.
              </p>
            ) : null}
          </div>
        ) : (
          <ul
            className={cn(
              "flex flex-col gap-3",
              mode === "builder" && "max-h-[420px] overflow-y-auto pr-1",
            )}
          >
            {displayed.map((q) => (
              <li key={q.id}>
                <LibraryQuestionCard
                  question={q}
                  codingEnabled={codingEnabled}
                  compact={mode === "builder"}
                  onPreview={() => setPreview(q)}
                  onAdd={() => openAddFlow([q])}
                />
              </li>
            ))}
          </ul>
        )}

        {mode === "page" ? (
          <p className="text-xs text-muted-foreground">
            {allItems.length} seeded questions ·{" "}
            <Link href="/tests/new" className="font-medium text-pine underline">
              Create a test
            </Link>{" "}
            ·{" "}
            <Link href="/library/admin" className="font-medium text-pine underline">
              Library admin
            </Link>
          </p>
        ) : null}
      </div>

      <LibraryPreviewDialog
        question={preview}
        questions={displayed}
        open={preview != null}
        codingEnabled={codingEnabled}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
        onNavigate={setPreview}
        onAdd={() => {
          if (preview) openAddFlow([preview])
        }}
      />

      {mode === "page" ? (
        <AddToTestDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          questions={pendingAdd}
          codingEnabled={codingEnabled}
        />
      ) : null}
    </div>
  )
}
