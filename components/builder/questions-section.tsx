"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import type { AiResistance, Question } from "@/lib/types"
import { codingQuestionsEnabledForTier, type PlanTier } from "@/lib/plans"
import { useOrganization } from "@/lib/store"
import { DescribeGeneratePanel } from "@/components/builder/describe-generate-panel"
import { LibraryBrowsePanel } from "@/components/builder/library-browse-panel"
import { QuestionEditor } from "@/components/builder/question-editor"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuestionCardMockup } from "@/components/empty-mockups"

type SortMode = "order" | "resistance_desc" | "resistance_asc"

const RESISTANCE_RANK: Record<AiResistance, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

export function QuestionsSection({
  testId,
  questions,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onInsert,
  onSuggestedTime,
}: {
  testId: string
  questions: Question[]
  onAdd: () => void
  onUpdate: (q: Question) => void
  onRemove: (id: string) => void
  onMove: (index: number, dir: -1 | 1) => void
  onInsert: (generated: Question[]) => void
  onSuggestedTime?: (minutes: number) => void
}) {
  const org = useOrganization()
  const codingEnabled = org
    ? codingQuestionsEnabledForTier(org.plan_tier as PlanTier)
    : false

  const [tab, setTab] = useState("describe")
  const [filterResistance, setFilterResistance] = useState<AiResistance | "all">(
    "all",
  )
  const [sortMode, setSortMode] = useState<SortMode>("order")

  const displayed = useMemo(() => {
    let list = questions.map((q, index) => ({ q, index }))
    if (filterResistance !== "all") {
      list = list.filter(
        ({ q }) => (q.ai_resistance ?? "medium") === filterResistance,
      )
    }
    if (sortMode === "resistance_desc") {
      list = [...list].sort(
        (a, b) =>
          RESISTANCE_RANK[b.q.ai_resistance ?? "medium"] -
          RESISTANCE_RANK[a.q.ai_resistance ?? "medium"],
      )
    } else if (sortMode === "resistance_asc") {
      list = [...list].sort(
        (a, b) =>
          RESISTANCE_RANK[a.q.ai_resistance ?? "medium"] -
          RESISTANCE_RANK[b.q.ai_resistance ?? "medium"],
      )
    }
    return list
  }, [questions, filterResistance, sortMode])

  function handleLibraryAdd(question: Question) {
    onInsert([{ ...question, position: questions.length }])
  }

  function handleAccept(accepted: Question[]) {
    onInsert(
      accepted.map((q, i) => ({ ...q, position: questions.length + i })),
    )
    setTab("manual")
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Questions</h2>
        <p className="text-sm text-muted-foreground">
          {questions.length} question{questions.length === 1 ? "" : "s"} in
          this test
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="describe">Describe what you need</TabsTrigger>
          <TabsTrigger value="library">Browse library</TabsTrigger>
          <TabsTrigger value="manual">Add manually</TabsTrigger>
        </TabsList>

        <TabsContent value="describe" className="pt-4">
          <DescribeGeneratePanel
            testId={testId}
            codingEnabled={codingEnabled}
            onAccept={handleAccept}
            onSuggestedTime={onSuggestedTime}
          />
        </TabsContent>

        <TabsContent value="library" className="pt-4">
          <LibraryBrowsePanel
            testId={testId}
            codingEnabled={codingEnabled}
            onAdd={handleLibraryAdd}
          />
        </TabsContent>

        <TabsContent value="manual" className="pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Select
                value={filterResistance}
                onValueChange={(v) =>
                  setFilterResistance(v as AiResistance | "all")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resistance</SelectItem>
                  <SelectItem value="high">High only</SelectItem>
                  <SelectItem value="medium">Medium only</SelectItem>
                  <SelectItem value="low">Low only</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortMode}
                onValueChange={(v) => setSortMode(v as SortMode)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Test order</SelectItem>
                  <SelectItem value="resistance_desc">
                    Resistance: high → low
                  </SelectItem>
                  <SelectItem value="resistance_asc">
                    Resistance: low → high
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={onAdd}>
              <Plus data-icon="inline-start" />
              Add question
            </Button>
          </div>

          {questions.length === 0 ? (
            <Empty className="rounded-lg border border-dashed border-border py-10">
              <EmptyHeader>
                <EmptyMedia>
                  <QuestionCardMockup />
                </EmptyMedia>
                <EmptyTitle className="text-base">
                  No questions yet
                </EmptyTitle>
                <EmptyDescription>
                  Use Describe or Browse library to get started, or add your
                  first question manually.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={onAdd}>
                  <Plus data-icon="inline-start" />
                  Add manually
                </Button>
              </EmptyContent>
            </Empty>
          ) : displayed.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No questions match this filter. Try a different AI resistance
              level.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {displayed.map(({ q, index }) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={index}
                  total={questions.length}
                  codingEnabled={codingEnabled}
                  onChange={onUpdate}
                  onRemove={() => onRemove(q.id)}
                  onMove={(dir) => onMove(index, dir)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
