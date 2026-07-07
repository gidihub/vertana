"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Send } from "lucide-react"
import { toast } from "sonner"

import type { Question, Test } from "@/lib/types"
import { uid, saveTest } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { QuestionsSection } from "@/components/builder/questions-section"

function newQuestion(testId: string, position: number): Question {
  return {
    id: uid(),
    test_id: testId,
    type: "multiple_choice",
    prompt: "",
    options: ["", ""],
    correct_option_index: 0,
    position,
    points: 1,
    ai_resistance: "medium",
    source: "custom",
  }
}

export function TestBuilder({ existing }: { existing?: Test }) {
  const router = useRouter()
  const testId = useMemo(() => existing?.id ?? uid(), [existing?.id])

  const [title, setTitle] = useState(existing?.title ?? "")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [timeLimit, setTimeLimit] = useState(
    String(existing?.time_limit_minutes ?? 30),
  )
  const [deadline, setDeadline] = useState(
    existing?.deadline ? existing.deadline.slice(0, 10) : "",
  )
  const [randomize, setRandomize] = useState(
    existing?.randomize_questions ?? false,
  )
  const [proctoring, setProctoring] = useState(
    existing?.requires_proctoring ?? true,
  )
  const [certEligible, setCertEligible] = useState(
    existing?.certificate_eligible ?? false,
  )
  const [certThreshold, setCertThreshold] = useState(
    String(existing?.certificate_percentile_threshold ?? 25),
  )
  const [questions, setQuestions] = useState<Question[]>(
    existing?.questions ?? [],
  )
  function addQuestion() {
    setQuestions((qs) => [...qs, newQuestion(testId, qs.length)])
  }

  function updateQuestion(q: Question) {
    setQuestions((qs) => qs.map((item) => (item.id === q.id ? q : item)))
  }

  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((item) => item.id !== id))
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const next = [...qs]
      const target = index + dir
      if (target < 0 || target >= next.length) return qs
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function insertGenerated(generated: Question[]) {
    setQuestions((qs) => [
      ...qs,
      ...generated.map((q, i) => ({ ...q, position: qs.length + i })),
    ])
  }

  function validate(): string | null {
    if (!title.trim()) return "Give your test a title."
    if (questions.length === 0) return "Add at least one question."
    for (const [i, q] of questions.entries()) {
      if (!q.prompt.trim()) return `Question ${i + 1} needs a prompt.`
      if (q.type === "multiple_choice") {
        if (q.options.some((o) => !o.trim()))
          return `Question ${i + 1} has an empty option.`
        if (q.correct_option_index === null)
          return `Question ${i + 1} needs a correct answer.`
      }
    }
    return null
  }

  async function persist(status: Test["status"]) {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    const test: Test = {
      id: testId,
      title: title.trim(),
      description: description.trim(),
      time_limit_minutes: Number(timeLimit) || 30,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      randomize_questions: randomize,
      requires_proctoring: proctoring,
      certificate_eligible: certEligible,
      certificate_percentile_threshold: Math.min(
        Math.max(Number(certThreshold) || 25, 1),
        100,
      ),
      status,
      token: existing?.token ?? "",
      created_at: existing?.created_at ?? new Date().toISOString(),
      questions: questions.map((q, i) => ({ ...q, position: i })),
    }

    try {
      await saveTest(test)
      toast.success(
        status === "active" ? "Test published" : "Draft saved",
      )
      router.push("/dashboard")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to tests
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-balance text-ink">
            {existing ? "Edit test" : "Create a new test"}
          </h1>
          <p className="text-muted-foreground">
            Configure the assessment, then add questions or generate them with AI.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Basic information candidates will see before they start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Test title</FieldLabel>
              <Input
                id="title"
                placeholder="e.g. Frontend Engineer Screening"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="Short context for the candidate about this assessment."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="time-limit">
                  Time limit (minutes)
                </FieldLabel>
                <Input
                  id="time-limit"
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="deadline">Deadline (optional)</FieldLabel>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
          <CardDescription>
            Control how the test is delivered and monitored.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="randomize" className="flex-1">
              Randomize question order
              <FieldDescription>
                Each candidate sees questions in a different order.
              </FieldDescription>
            </FieldLabel>
            <Switch
              id="randomize"
              checked={randomize}
              onCheckedChange={setRandomize}
            />
          </Field>
          <Separator />
          <Field orientation="horizontal">
            <FieldLabel htmlFor="proctoring" className="flex-1">
              Require proctoring consent
              <FieldDescription>
                Candidates must accept monitoring terms and tab-switching is
                tracked during the test.
              </FieldDescription>
            </FieldLabel>
            <Switch
              id="proctoring"
              checked={proctoring}
              onCheckedChange={setProctoring}
            />
          </Field>
          <Separator />
          <Field orientation="horizontal">
            <FieldLabel htmlFor="certificate" className="flex-1">
              Certificate eligible
              <FieldDescription>
                Top-scoring candidates can optionally receive a shareable
                certificate.
              </FieldDescription>
            </FieldLabel>
            <Switch
              id="certificate"
              checked={certEligible}
              onCheckedChange={setCertEligible}
            />
          </Field>
          {certEligible ? (
            <Field className="pl-1">
              <FieldLabel htmlFor="cert-threshold">
                Percentile threshold
              </FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Top</span>
                <Input
                  id="cert-threshold"
                  type="number"
                  min={1}
                  max={100}
                  value={certThreshold}
                  onChange={(e) => setCertThreshold(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <FieldDescription>
                Candidates who finish in this percentile are offered a
                certificate.
              </FieldDescription>
            </Field>
          ) : null}
        </CardContent>
      </Card>

      <QuestionsSection
        testId={testId}
        questions={questions}
        onAdd={addQuestion}
        onUpdate={updateQuestion}
        onRemove={removeQuestion}
        onMove={moveQuestion}
        onInsert={insertGenerated}
        onSuggestedTime={(minutes) => setTimeLimit(String(minutes))}
      />

      <Separator />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => persist("draft")}>
          <Save data-icon="inline-start" />
          Save as draft
        </Button>
        <Button onClick={() => persist("active")}>
          <Send data-icon="inline-start" />
          {existing ? "Save & publish" : "Publish test"}
        </Button>
      </div>

    </div>
  )
}
