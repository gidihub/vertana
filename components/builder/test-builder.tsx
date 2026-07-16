"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"

import type { Question, Test, TimingPolicy } from "@/lib/types"
import { uid, saveTest, useOrganization } from "@/lib/store"
import {
  duplicateQuestionsError,
  filterNewQuestions,
} from "@/lib/questions/duplicates"
import { suggestedTimeLimit } from "@/lib/questions/time-estimate"
import { proctoringEnabledForTier, type PlanTier } from "@/lib/plans"
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
import { TestSettingsSection } from "@/components/builder/test-settings-section"

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
  const org = useOrganization()
  const canProctor =
    org?.is_comp === true ||
    proctoringEnabledForTier((org?.plan_tier ?? "free") as PlanTier)
  const testId = useMemo(() => existing?.id ?? uid(), [existing?.id])

  const [title, setTitle] = useState(existing?.title ?? "")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [timeLimit, setTimeLimit] = useState(
    String(existing?.time_limit_minutes ?? 30),
  )
  // When false, the time limit auto-follows the sum of question durations.
  // Editing the field (or accepting an AI-suggested time) locks it to manual.
  const [timeLimitManual, setTimeLimitManual] = useState(existing != null)
  const [passingScore, setPassingScore] = useState(
    String(existing?.passing_score ?? 70),
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
  // Proctoring is a paid feature — force it off (and keep it off) on Free plans
  // so the test can be saved without hitting the server-side gate.
  useEffect(() => {
    if (!canProctor && proctoring) setProctoring(false)
  }, [canProctor, proctoring])
  const [certEligible, setCertEligible] = useState(
    existing?.certificate_eligible ?? false,
  )
  const [certThreshold, setCertThreshold] = useState(
    String(existing?.certificate_percentile_threshold ?? 25),
  )
  const [timingPolicy, setTimingPolicy] = useState<TimingPolicy>(
    existing?.timing_policy ?? "normal",
  )
  const [forbidAiTools, setForbidAiTools] = useState(
    existing?.forbid_ai_tools ?? false,
  )
  const [notifyEmails, setNotifyEmails] = useState<string[]>(
    existing?.notify_emails ?? [],
  )
  const [creatorEmail, setCreatorEmail] = useState<string>()
  const [questions, setQuestions] = useState<Question[]>(
    existing?.questions ?? [],
  )
  const [suggestingDetails, setSuggestingDetails] = useState(false)

  const canSuggestDetails = useMemo(
    () => questions.some((q) => q.prompt.trim()),
    [questions],
  )

  const suggestedTime = useMemo(
    () => suggestedTimeLimit(questions),
    [questions],
  )

  // In auto mode, keep the time limit in sync with the question durations.
  useEffect(() => {
    if (timeLimitManual) return
    if (suggestedTime == null) return
    setTimeLimit((current) =>
      current === String(suggestedTime) ? current : String(suggestedTime),
    )
  }, [suggestedTime, timeLimitManual])

  useEffect(() => {
    if (existing?.notify_emails?.length) return
    void fetch("/api/org")
      .then((res) => res.json())
      .then((data: { user_email?: string }) => {
        if (data.user_email) setCreatorEmail(data.user_email)
      })
      .catch(() => {})
  }, [existing?.notify_emails?.length])
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
    let skipped = 0
    setQuestions((qs) => {
      const { accepted, skipped: duplicateCount } = filterNewQuestions(
        qs,
        generated,
      )
      skipped = duplicateCount
      if (accepted.length === 0) return qs
      return [
        ...qs,
        ...accepted.map((q, i) => ({ ...q, position: qs.length + i })),
      ]
    })
    if (skipped > 0) {
      toast.error(
        skipped === 1
          ? "That question is already on this test"
          : `${skipped} questions were already on this test and were skipped`,
      )
    }
  }

  async function suggestDetails() {
    const eligible = questions.filter((q) => q.prompt.trim())
    if (!eligible.length) {
      toast.error("Add at least one question with a prompt first")
      return
    }

    setSuggestingDetails(true)
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestDetails: true,
          questions: eligible.map((q) => ({
            type: q.type,
            prompt: q.prompt,
            estimated_minutes: q.estimated_minutes ?? null,
            difficulty: q.difficulty ?? null,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")

      setTitle(data.details.title)
      setDescription(data.details.description)
      setTimeLimit(String(data.details.time_limit_minutes))
      setTimeLimitManual(true)
      if (data.details.suggested_deadline && !deadline) {
        setDeadline(data.details.suggested_deadline.slice(0, 10))
      }
      toast.success("Details suggested from your questions — review before saving")
    } catch (err) {
      toast.error((err as Error).message || "Could not suggest details")
    } finally {
      setSuggestingDetails(false)
    }
  }

  function validate(): string | null {
    if (!title.trim()) return "Give your test a title."
    if (String(passingScore).trim() === "")
      return "Passing score must be a whole number between 0 and 100."
    const pass = Number(passingScore)
    if (!Number.isInteger(pass) || pass < 0 || pass > 100)
      return "Passing score must be a whole number between 0 and 100."
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
    const duplicateError = duplicateQuestionsError(questions)
    if (duplicateError) return duplicateError
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
      passing_score: Number(passingScore),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      randomize_questions: randomize,
      requires_proctoring: proctoring,
      certificate_eligible: certEligible,
      certificate_percentile_threshold: Math.min(
        Math.max(Number(certThreshold) || 25, 1),
        100,
      ),
      timing_policy: timingPolicy,
      forbid_ai_tools: forbidAiTools,
      notify_emails: notifyEmails,
      is_pinned: existing?.is_pinned ?? false,
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Basic information candidates will see before they start. Add
              questions below, then use Suggest with AI to draft title,
              description, and time limit.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-primary/30 text-primary hover:bg-primary/5"
            disabled={!canSuggestDetails || suggestingDetails}
            onClick={() => void suggestDetails()}
          >
            {suggestingDetails ? (
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles className="size-4" data-icon="inline-start" />
            )}
            Suggest with AI
          </Button>
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
                  onChange={(e) => {
                    setTimeLimit(e.target.value)
                    setTimeLimitManual(true)
                  }}
                />
                <FieldDescription>
                  {!timeLimitManual && suggestedTime != null ? (
                    "Auto-calculated from question durations. Edit to override."
                  ) : suggestedTime != null &&
                    String(suggestedTime) !== timeLimit ? (
                    <>
                      Suggested from questions: {suggestedTime} min.{" "}
                      <button
                        type="button"
                        className="font-medium text-primary underline underline-offset-2"
                        onClick={() => {
                          setTimeLimit(String(suggestedTime))
                          setTimeLimitManual(false)
                        }}
                      >
                        Use {suggestedTime} min
                      </button>
                    </>
                  ) : (
                    "Based on the total length of your questions."
                  )}
                </FieldDescription>
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
            <Field>
              <FieldLabel htmlFor="passing-score">Passing score</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="passing-score"
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <FieldDescription>
                Candidates who score at or above this are marked as a pass.
              </FieldDescription>
            </Field>
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
                {canProctor
                  ? "Candidates must accept monitoring terms and tab-switching is tracked during the test."
                  : "Proctoring + face verification is available on paid plans. Upgrade to Starter or higher to require proctoring. Tab-switch integrity detection stays on for every plan."}
              </FieldDescription>
            </FieldLabel>
            <Switch
              id="proctoring"
              checked={proctoring && canProctor}
              disabled={!canProctor}
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

      <TestSettingsSection
        timingPolicy={timingPolicy}
        onTimingPolicyChange={setTimingPolicy}
        forbidAiTools={forbidAiTools}
        onForbidAiToolsChange={setForbidAiTools}
        notifyEmails={notifyEmails}
        onNotifyEmailsChange={setNotifyEmails}
        defaultCreatorEmail={creatorEmail}
      />

      <QuestionsSection
        testId={testId}
        questions={questions}
        onAdd={addQuestion}
        onUpdate={updateQuestion}
        onRemove={removeQuestion}
        onMove={moveQuestion}
        onInsert={insertGenerated}
        onSuggestedTime={(minutes) => {
          setTimeLimit(String(minutes))
          setTimeLimitManual(true)
        }}
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
