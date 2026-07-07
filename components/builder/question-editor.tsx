"use client"

import { Trash2, GripVertical, ChevronUp, ChevronDown, Check } from "lucide-react"

import type { AiResistance, Question, QuestionType } from "@/lib/types"
import { AiResistanceBadge } from "@/components/builder/ai-resistance-badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  coding: "Coding",
}

export function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  question: Question
  index: number
  total: number
  onChange: (q: Question) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  function update(patch: Partial<Question>) {
    onChange({ ...question, ...patch })
  }

  function setType(type: QuestionType) {
    if (type === "multiple_choice") {
      const options = question.options.length ? question.options : ["", ""]
      update({
        type,
        options,
        correct_option_index: question.correct_option_index ?? 0,
      })
    } else {
      update({ type, options: [], correct_option_index: null })
    }
  }

  function updateOption(i: number, value: string) {
    const options = [...question.options]
    options[i] = value
    update({ options })
  }

  function addOption() {
    if (question.options.length >= 6) return
    update({ options: [...question.options, ""] })
  }

  function removeOption(i: number) {
    if (question.options.length <= 2) return
    const options = question.options.filter((_, idx) => idx !== i)
    let correct = question.correct_option_index ?? 0
    if (correct === i) correct = 0
    else if (correct > i) correct -= 1
    update({ options, correct_option_index: correct })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical className="size-4" aria-hidden />
          <span className="text-sm font-medium text-foreground">
            Question {index + 1}
          </span>
          <Badge variant="secondary">{TYPE_LABELS[question.type]}</Badge>
          {question.ai_resistance ? (
            <AiResistanceBadge level={question.ai_resistance} compact />
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move question up"
          >
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move question down"
          >
            <ChevronDown />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Delete question"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px_120px_100px]">
          <Field>
            <FieldLabel htmlFor={`prompt-${question.id}`}>Prompt</FieldLabel>
            <Textarea
              id={`prompt-${question.id}`}
              placeholder="What do you want to ask?"
              value={question.prompt}
              onChange={(e) => update({ prompt: e.target.value })}
              rows={2}
            />
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              value={question.type}
              onValueChange={(v) => setType(v as QuestionType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                <SelectItem value="short_answer">Short answer</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>AI resistance</FieldLabel>
            <Select
              value={question.ai_resistance ?? "medium"}
              onValueChange={(v) =>
                update({ ai_resistance: v as AiResistance })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`points-${question.id}`}>Points</FieldLabel>
            <Input
              id={`points-${question.id}`}
              type="number"
              min={1}
              max={100}
              value={question.points ?? 1}
              onChange={(e) =>
                update({ points: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </Field>
        </div>

        {question.type === "multiple_choice" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              Answer options{" "}
              <span className="font-normal text-muted-foreground">
                (select the correct one)
              </span>
            </span>
            {question.options.map((opt, i) => {
              const isCorrect = question.correct_option_index === i
              return (
                <div key={i} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isCorrect ? "default" : "outline"}
                    size="icon"
                    onClick={() => update({ correct_option_index: i })}
                    aria-label={`Mark option ${i + 1} correct`}
                    aria-pressed={isCorrect}
                    className={cn("shrink-0", !isCorrect && "text-transparent")}
                  >
                    <Check />
                  </Button>
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(i)}
                    disabled={question.options.length <= 2}
                    aria-label={`Remove option ${i + 1}`}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              )
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={question.options.length >= 6}
              className="self-start"
            >
              Add option
            </Button>
          </div>
        )}

        {question.type === "short_answer" && (
          <div className="flex flex-col gap-3">
            <Field>
              <FieldLabel htmlFor={`exact-${question.id}`}>
                Auto-grade answer (optional)
              </FieldLabel>
              <Input
                id={`exact-${question.id}`}
                placeholder="Exact match for auto-grading"
                value={question.correct_answer_exact ?? ""}
                onChange={(e) =>
                  update({
                    correct_answer_exact: e.target.value || null,
                  })
                }
              />
            </Field>
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Leave blank to grade manually from results. Set an exact answer to
              auto-score on submit.
            </p>
          </div>
        )}

        {question.type === "coding" && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground font-mono">
            Candidates will write code in a plain editor. Submissions are reviewed
            manually from the results dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
