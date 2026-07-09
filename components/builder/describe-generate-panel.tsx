"use client"

import { useState } from "react"
import {
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { clampTestCases } from "@/lib/coding/limits"
import type { PlannedQuestion, Question, TestPlan } from "@/lib/types"
import { uid } from "@/lib/store"
import { AiResistanceBadge } from "@/components/builder/ai-resistance-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"

const TYPE_LABELS = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  coding: "Coding",
} as const

function withTempIds(plan: TestPlan): TestPlan {
  return {
    ...plan,
    questions: plan.questions.map((q) => ({
      ...q,
      tempId: q.tempId || uid(),
    })),
  }
}

function plannedToQuestion(
  q: PlannedQuestion,
  testId: string,
  position: number,
): Question {
  return {
    id: uid(),
    test_id: testId,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    correct_option_index: q.correct_option_index,
    correct_answer_exact: q.correct_answer_exact ?? null,
    position,
    points: q.points ?? (q.type === "coding" ? 3 : 1),
    ai_resistance: q.ai_resistance,
    source: "ai_generated",
    estimated_minutes: q.estimated_minutes,
    difficulty: q.difficulty,
    test_cases: q.type === "coding" ? clampTestCases(q.test_cases ?? []) : [],
  }
}

function PlanQuestionCard({
  question,
  index,
  total,
  brief,
  onChange,
  onRemove,
  onMove,
  onRegenerate,
  regenerating,
}: {
  question: PlannedQuestion
  index: number
  total: number
  brief: string
  onChange: (q: PlannedQuestion) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onRegenerate: () => void
  regenerating: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(question.prompt)

  function saveEdit() {
    onChange({ ...question, prompt: draft.trim() || question.prompt })
    setEditing(false)
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Q{index + 1}</span>
          <Badge variant="secondary">{TYPE_LABELS[question.type]}</Badge>
          <Badge variant="outline">{question.estimated_minutes} min</Badge>
          <AiResistanceBadge level={question.ai_resistance} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move up"
          >
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move down"
          >
            <ChevronDown />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDraft(question.prompt)
              setEditing(true)
            }}
            aria-label="Edit prompt"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRegenerate}
            disabled={regenerating}
            aria-label="Regenerate question"
          >
            {regenerating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Remove question"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="p-4">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}>
                <Check data-icon="inline-start" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                <X data-icon="inline-start" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{question.prompt}</p>
        )}
      </div>
    </div>
  )
}

export function DescribeGeneratePanel({
  testId,
  codingEnabled,
  onAccept,
  onSuggestedTime,
}: {
  testId: string
  codingEnabled: boolean
  onAccept: (questions: Question[]) => void
  onSuggestedTime?: (minutes: number) => void
}) {
  const [brief, setBrief] = useState("")
  const [step, setStep] = useState<"brief" | "review">("brief")
  const [plan, setPlan] = useState<TestPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  async function generatePlan() {
    if (!brief.trim()) {
      toast.error("Tell us about the role first")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: brief.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")

      if (!data.plan) {
        throw new Error("AI returned an empty plan")
      }
      if (data.source !== "ai") {
        throw new Error("Expected AI-generated plan but received non-AI source")
      }

      const next = withTempIds(data.plan as TestPlan)
      setPlan(next)
      setStep("review")
      toast.success("Draft plan ready — review before adding")
    } catch (err) {
      toast.error((err as Error).message || "Could not generate plan")
    } finally {
      setLoading(false)
    }
  }

  function updateQuestion(q: PlannedQuestion) {
    if (!plan) return
    setPlan({
      ...plan,
      questions: plan.questions.map((item) =>
        item.tempId === q.tempId ? q : item,
      ),
    })
  }

  function removeQuestion(tempId: string) {
    if (!plan) return
    const questions = plan.questions.filter((q) => q.tempId !== tempId)
    setPlan({
      ...plan,
      questions,
      question_count: questions.length,
    })
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    if (!plan) return
    const questions = [...plan.questions]
    const target = index + dir
    if (target < 0 || target >= questions.length) return
    ;[questions[index], questions[target]] = [questions[target], questions[index]]
    setPlan({ ...plan, questions })
  }

  async function regenerateQuestion(q: PlannedQuestion) {
    setRegeneratingId(q.tempId)
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: brief.trim(),
          regenerate: { prompt: q.prompt, type: q.type },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")

      if (data.source !== "ai" || !data.question) {
        throw new Error("Expected AI-generated question")
      }

      const replacement = {
        ...data.question,
        tempId: q.tempId,
      } as PlannedQuestion
      updateQuestion(replacement)
      toast.success("Question swapped for a new AI draft")
    } catch (err) {
      toast.error((err as Error).message || "Could not regenerate")
    } finally {
      setRegeneratingId(null)
    }
  }

  function acceptPlan() {
    if (!plan || plan.questions.length === 0) {
      toast.error("Add at least one question to the plan")
      return
    }
    const eligible = plan.questions.filter(
      (q) => codingEnabled || q.type !== "coding",
    )
    const skippedCoding = plan.questions.length - eligible.length
    if (eligible.length === 0) {
      toast.error("Coding questions require a Growth plan. Upgrade to add them.")
      return
    }
    onSuggestedTime?.(plan.total_time_minutes)
    onAccept(eligible.map((q, i) => plannedToQuestion(q, testId, i)))
    setStep("brief")
    setPlan(null)
    setBrief("")
    if (skippedCoding > 0) {
      toast.success(
        `Added ${eligible.length} questions (${skippedCoding} coding skipped — Growth plan required)`,
      )
    } else {
      toast.success(`Added ${eligible.length} questions to your test`)
    }
  }

  if (step === "review" && plan) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Proposed test plan</CardTitle>
            <CardDescription>{plan.summary}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Badge variant="outline">{plan.question_count} questions</Badge>
            <Badge variant="outline">{plan.total_time_minutes} min total</Badge>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          {plan.questions.map((q, i) => (
            <PlanQuestionCard
              key={q.tempId}
              question={q}
              index={i}
              total={plan.questions.length}
              brief={brief}
              onChange={updateQuestion}
              onRemove={() => removeQuestion(q.tempId)}
              onMove={(dir) => moveQuestion(i, dir)}
              onRegenerate={() => regenerateQuestion(q)}
              regenerating={regeneratingId === q.tempId}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setStep("brief")}>
            Edit brief
          </Button>
          <Button onClick={acceptPlan}>
            <Check data-icon="inline-start" />
            Accept and continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="role-brief">Tell us about the role</FieldLabel>
        <Textarea
          id="role-brief"
          placeholder='e.g. "Mid-level frontend engineer, React-heavy, 45 minutes, mix of MCQ and one coding challenge"'
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
          disabled={loading}
        />
        <FieldDescription>
          Include seniority, stack, time budget, and question mix. We&apos;ll
          propose a structured plan — nothing is added until you accept it.
        </FieldDescription>
      </Field>
      <Button onClick={generatePlan} disabled={loading} className="self-start">
        {loading ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <Sparkles data-icon="inline-start" />
        )}
        {loading ? "Generating plan…" : "Generate test plan"}
      </Button>
    </div>
  )
}
