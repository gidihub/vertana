"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import type { Test } from "@/lib/types"
import {
  submitAttempt,
  startCandidateAttempt,
  loadResumeAttempt,
  type ProctoringPolicyView,
} from "@/lib/store"
import { buildConsentSnapshot, getConsentCopy } from "@/lib/consent"
import { isCameraProctoringEnabledClient } from "@/lib/proctoring/config"
import { appShell } from "@/lib/design-tokens"
import { CandidateHeader } from "@/components/candidate/candidate-header"
import { StartStep } from "@/components/candidate/start-step"
import { ConsentStep } from "@/components/candidate/consent-step"
import { ProctoringSetupStep } from "@/components/candidate/proctoring-setup-step"
import { TestRunner } from "@/components/candidate/test-runner"
import { DoneStep } from "@/components/candidate/done-step"
import { CertificateStep } from "@/components/candidate/certificate-step"

type Step = "start" | "consent" | "proctoring" | "test" | "certificate" | "done"

export function CandidateFlow({
  test,
  token,
  proctoringPolicy,
}: {
  test: Test
  token: string
  proctoringPolicy?: ProctoringPolicyView | null
}) {
  const [step, setStep] = useState<Step>("start")
  const [email, setEmail] = useState("")
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [certBand, setCertBand] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({})
  const [initialTabSwitches, setInitialTabSwitches] = useState(0)
  const [startedAt, setStartedAt] = useState<string>("")
  const consentAcceptedRef = useRef(false)
  const cameraProctoring = isCameraProctoringEnabledClient()

  async function persistConsent(id: string) {
    const copy = getConsentCopy()
    const res = await fetch(`/api/candidate/${token}/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: id,
        version: copy.version,
      }),
    })
    if (!res.ok) {
      let message = "Failed to save consent"
      try {
        const data = (await res.json()) as { error?: string }
        if (data.error) message = data.error
      } catch {
        // ignore non-JSON error bodies
      }
      throw new Error(message)
    }
  }

  async function handleStart(candidateEmail: string) {
    try {
      const { attemptId: id, resumed } = await startCandidateAttempt(
        token,
        candidateEmail,
      )
      setEmail(candidateEmail)
      setAttemptId(id)

      if (resumed) {
        const resume = await loadResumeAttempt({
          token,
          attemptId: id,
          email: candidateEmail,
        })
        setInitialAnswers(resume.answers)
        setInitialTabSwitches(resume.tabSwitchCount)
        setStartedAt(resume.startedAt ?? new Date().toISOString())
        setStep("test")
        return
      }

      if (test.requires_proctoring) {
        setStep("consent")
      } else {
        setStartedAt(new Date().toISOString())
        setStep("test")
      }
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleConsentAccept() {
    if (!attemptId) return
    try {
      await persistConsent(attemptId)
      consentAcceptedRef.current = true
      if (cameraProctoring) {
        setStep("proctoring")
        return
      }
      setStartedAt(new Date().toISOString())
      setStep("test")
    } catch (err) {
      consentAcceptedRef.current = false
      toast.error((err as Error).message)
    }
  }

  function handleProctoringComplete() {
    setStartedAt(new Date().toISOString())
    setStep("test")
  }

  async function handleSubmit(result: {
    answers: Record<string, string>
    tabSwitchCount: number
  }) {
    if (!attemptId || submitting) return
    setSubmitting(true)
    try {
      const copy = getConsentCopy()
      const { certificate } = await submitAttempt({
        token,
        attemptId,
        answers: result.answers,
        tabSwitchCount: result.tabSwitchCount,
        consent: test.requires_proctoring
          ? {
              version: copy.version,
              snapshot: buildConsentSnapshot(copy),
            }
          : undefined,
      })

      if (certificate.qualifies) {
        setCertBand(certificate.band)
        setStep("certificate")
      } else {
        setStep("done")
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={appShell}>
      <CandidateHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        {step === "start" && <StartStep test={test} onStart={handleStart} />}
        {step === "consent" && (
          <ConsentStep
            onAccept={() => void handleConsentAccept()}
            onDecline={() => setStep("start")}
          />
        )}
        {step === "proctoring" && attemptId && (
          <ProctoringSetupStep
            token={token}
            attemptId={attemptId}
            onComplete={handleProctoringComplete}
            onSkip={() => setStep("consent")}
          />
        )}
        {step === "test" && attemptId && (
          <TestRunner
            test={test}
            token={token}
            attemptId={attemptId}
            startedAt={startedAt}
            initialAnswers={initialAnswers}
            initialTabSwitches={initialTabSwitches}
            proctoringPolicy={proctoringPolicy}
            onSubmit={handleSubmit}
          />
        )}
        {step === "certificate" && attemptId && (
          <CertificateStep
            test={test}
            token={token}
            attemptId={attemptId}
            band={certBand}
            email={email}
            onDecline={() => setStep("done")}
          />
        )}
        {step === "done" && <DoneStep email={email} />}
      </main>
    </div>
  )
}
