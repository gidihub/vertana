"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { SolvabilityResultPanel } from "@/components/marketing/ai-solvability-result"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  QUESTION_MAX_LENGTH,
  QUESTION_MIN_LENGTH,
  QUESTION_TYPES,
  type SolvabilityQuestionType,
  type SolvabilityResult,
} from "@/lib/tools/ai-solvability-shared"
import { trackSolvabilityEvent } from "@/lib/tools/ai-solvability-analytics"

const QUESTION_TYPE_LABELS: Record<SolvabilityQuestionType, string> = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  coding: "Coding",
}

type ApiError = {
  error?: string
  message?: string
  signupUrl?: string
}

export function AiSolvabilityChecker({
  libraryHighResistancePct,
  libraryQuestionCount,
}: {
  libraryHighResistancePct: number
  libraryQuestionCount: number
}) {
  const [question, setQuestion] = useState("")
  const [questionType, setQuestionType] = useState<SolvabilityQuestionType | "">("")
  const [roleContext, setRoleContext] = useState("")
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [rateLimited, setRateLimited] = useState<{
    message: string
    signupUrl?: string
  } | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [result, setResult] = useState<SolvabilityResult | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharePending, setSharePending] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [emailPending, setEmailPending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function runCheck() {
    setInputError(null)
    setRateLimited(null)
    setUnavailable(false)
    setShareUrl(null)
    setShareCopied(false)
    setEmailSent(false)
    setLoading(true)

    try {
      const res = await fetch("/api/tools/ai-solvability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          questionType: questionType || null,
          roleContext: roleContext || null,
        }),
      })

      const data = (await res.json()) as SolvabilityResult & ApiError

      if (res.status === 503) {
        setUnavailable(true)
        return
      }

      if (res.status === 429) {
        setRateLimited({
          message:
            data.message ??
            "You've hit the free check limit. Sign up for unlimited question design.",
          signupUrl: data.signupUrl,
        })
        return
      }

      if (!res.ok) {
        setInputError(data.message ?? data.error ?? "Could not run the check.")
        return
      }

      setResult(data)
      trackSolvabilityEvent("solvability_check_run", {
        verdict: data.verdict,
        cached: data.cached,
      })
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function shareResult() {
    if (!result) return
    setSharePending(true)
    try {
      const res = await fetch("/api/tools/ai-solvability/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkId: result.id }),
      })
      const data = (await res.json()) as { shareUrl?: string; error?: string }
      if (!res.ok || !data.shareUrl) {
        toast.error(data.error ?? "Could not create share link.")
        return
      }
      setShareUrl(data.shareUrl)
      await navigator.clipboard.writeText(
        `${window.location.origin}${data.shareUrl}`,
      )
      setShareCopied(true)
      trackSolvabilityEvent("solvability_share_click", { verdict: result.verdict })
    } catch {
      toast.error("Could not create share link.")
    } finally {
      setSharePending(false)
    }
  }

  async function submitEmail() {
    if (!result || !email.trim()) return
    setEmailPending(true)
    try {
      const res = await fetch("/api/tools/ai-solvability/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkId: result.id, email: email.trim() }),
      })
      if (!res.ok) {
        toast.error("Could not save your email. Try again.")
        return
      }
      setEmailSent(true)
      trackSolvabilityEvent("solvability_email_submit")
    } finally {
      setEmailPending(false)
    }
  }

  function reset() {
    setResult(null)
    setShareUrl(null)
    setShareCopied(false)
    setEmailSent(false)
    setInputError(null)
    setRateLimited(null)
    setUnavailable(false)
  }

  if (unavailable) {
    return (
      <UnavailableState onRetry={() => setUnavailable(false)} />
    )
  }

  if (result) {
    return (
      <SolvabilityResultPanel
        result={result}
        question={question}
        libraryHighResistancePct={libraryHighResistancePct}
        shareUrl={shareUrl}
        onCheckAnother={reset}
        onShare={shareResult}
        sharePending={sharePending}
        shareCopied={shareCopied}
        showEmailForm
        email={email}
        onEmailChange={setEmail}
        onEmailSubmit={() => void submitEmail()}
        emailPending={emailPending}
        emailSent={emailSent}
      />
    )
  }

  return (
    <div className="space-y-6">
      {rateLimited ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
          <p>{rateLimited.message}</p>
          {rateLimited.signupUrl ? (
            <Link
              href={rateLimited.signupUrl}
              className="mt-3 inline-flex font-semibold text-pine underline-offset-2 hover:underline"
            >
              Create a free account
            </Link>
          ) : null}
        </div>
      ) : null}

      <form
        className="rounded-2xl border border-sage-line bg-card p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault()
          void runCheck()
        }}
      >
        <Field>
          <FieldLabel htmlFor="question">Interview or assessment question</FieldLabel>
          <textarea
            id="question"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={8}
            maxLength={QUESTION_MAX_LENGTH}
            placeholder="Paste a question from your take-home, live interview, or internal question bank…"
            className="w-full rounded-xl border border-sage-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none ring-pine focus-visible:ring-2"
          />
          <FieldDescription>
            {question.trim().length}/{QUESTION_MAX_LENGTH} characters ·{" "}
            {QUESTION_MIN_LENGTH} minimum
          </FieldDescription>
        </Field>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="question-type">Question type (optional)</FieldLabel>
            <select
              id="question-type"
              value={questionType}
              onChange={(e) =>
                setQuestionType(e.target.value as SolvabilityQuestionType | "")
              }
              className="h-10 w-full rounded-lg border border-sage-line bg-paper px-3 text-sm text-ink outline-none ring-pine focus-visible:ring-2"
            >
              <option value="">Not specified</option>
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {QUESTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="role-context">Role context (optional)</FieldLabel>
            <input
              id="role-context"
              value={roleContext}
              onChange={(e) => setRoleContext(e.target.value)}
              maxLength={120}
              placeholder="e.g. Senior backend engineer"
              className="h-10 w-full rounded-lg border border-sage-line bg-paper px-3 text-sm text-ink outline-none ring-pine focus-visible:ring-2"
            />
          </Field>
        </div>

        {inputError ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {inputError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={loading || question.trim().length < QUESTION_MIN_LENGTH}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Checking…
              </>
            ) : (
              "Check solvability"
            )}
          </Button>
          <p className="text-xs text-ink-muted">
            Free · no login · {libraryQuestionCount.toLocaleString()} library questions scored the same way
          </p>
        </div>
      </form>

      <PrivacyNote />
    </div>
  )
}

function UnavailableState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-sage-line bg-card p-8 text-center">
      <h2 className="text-xl font-semibold text-ink">Back shortly</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        The checker is temporarily at capacity. We&apos;re not running new model
        calls right now — please try again in a little while.
      </p>
      <Button type="button" className="mt-6" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

export function PrivacyNote() {
  return (
    <p className="text-xs leading-relaxed text-ink-muted">
      Privacy: we store a hash of your question, the verdict, and aggregate stats —
      not the question text or your IP. We don&apos;t use submissions to train models.
      Share links are opt-in only.
    </p>
  )
}
