"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import type { Test } from "@/lib/types"
import {
  submitAttempt,
  startCandidateAttempt,
  loadResumeAttempt,
} from "@/lib/store"
import { CONSENT_VERSION, buildConsentSnapshot } from "@/lib/consent"
import { appShell } from "@/lib/design-tokens"
import { CandidateHeader } from "@/components/candidate/candidate-header"
import { StartStep } from "@/components/candidate/start-step"
import { ConsentStep } from "@/components/candidate/consent-step"
import { TestRunner } from "@/components/candidate/test-runner"
import { DoneStep } from "@/components/candidate/done-step"
import { CertificateStep } from "@/components/candidate/certificate-step"

type Step = "start" | "consent" | "test" | "certificate" | "done"

export function CandidateFlow({
  test,
  token,
}: {
  test: Test
  token: string
}) {
  const [step, setStep] = useState<Step>("start")
  const [email, setEmail] = useState("")
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [certBand, setCertBand] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({})
  const [initialTabSwitches, setInitialTabSwitches] = useState(0)
  const startedAtRef = useRef<string>("")
  const consentAcceptedRef = useRef(false)

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
        startedAtRef.current = resume.startedAt ?? new Date().toISOString()
        setStep("test")
        return
      }

      if (test.requires_proctoring) {
        setStep("consent")
      } else {
        startedAtRef.current = new Date().toISOString()
        setStep("test")
      }
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  function handleConsentAccept() {
    consentAcceptedRef.current = true
    startedAtRef.current = new Date().toISOString()
    setStep("test")
  }

  async function handleSubmit(result: {
    answers: Record<string, string>
    tabSwitchCount: number
  }) {
    if (!attemptId || submitting) return
    setSubmitting(true)
    try {
      const { certificate } = await submitAttempt({
        token,
        attemptId,
        answers: result.answers,
        tabSwitchCount: result.tabSwitchCount,
        consent: test.requires_proctoring
          ? {
              version: CONSENT_VERSION,
              snapshot: buildConsentSnapshot(),
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
            onAccept={handleConsentAccept}
            onDecline={() => setStep("start")}
          />
        )}
        {step === "test" && attemptId && (
          <TestRunner
            test={test}
            token={token}
            attemptId={attemptId}
            initialAnswers={initialAnswers}
            initialTabSwitches={initialTabSwitches}
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
