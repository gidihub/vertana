"use client"

import { useRef, useState } from "react"

import type { Test } from "@/lib/types"
import { submitAttempt, evaluateCertificate } from "@/lib/store"
import { markSubmitted } from "@/lib/attempt"
import { CONSENT_VERSION, buildConsentSnapshot } from "@/lib/consent"
import { StartStep } from "@/components/candidate/start-step"
import { ConsentStep } from "@/components/candidate/consent-step"
import { TestRunner } from "@/components/candidate/test-runner"
import { DoneStep } from "@/components/candidate/done-step"
import { CertificateStep } from "@/components/candidate/certificate-step"

type Step = "start" | "consent" | "test" | "certificate" | "done"

export function CandidateFlow({ test }: { test: Test }) {
  const [step, setStep] = useState<Step>("start")
  const [email, setEmail] = useState("")
  const [certBand, setCertBand] = useState("")
  const startedAtRef = useRef<string>("")
  const consentAcceptedRef = useRef(false)

  function handleStart(candidateEmail: string) {
    setEmail(candidateEmail)
    if (test.requires_proctoring) {
      setStep("consent")
    } else {
      startedAtRef.current = new Date().toISOString()
      setStep("test")
    }
  }

  function handleConsentAccept() {
    consentAcceptedRef.current = true
    startedAtRef.current = new Date().toISOString()
    setStep("test")
  }

  function handleSubmit(result: {
    answers: Record<string, string>
    tabSwitchCount: number
  }) {
    const candidate = submitAttempt({
      testId: test.id,
      email,
      answers: result.answers,
      tabSwitchCount: result.tabSwitchCount,
      startedAt: startedAtRef.current || new Date().toISOString(),
      consent: test.requires_proctoring
        ? {
            accepted: consentAcceptedRef.current,
            version: CONSENT_VERSION,
            snapshot: buildConsentSnapshot(),
          }
        : undefined,
    })
    markSubmitted(test.token)

    const cert = evaluateCertificate(test, candidate)
    if (cert.qualifies) {
      setCertBand(cert.band)
      setStep("certificate")
    } else {
      setStep("done")
    }
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        {step === "start" && <StartStep test={test} onStart={handleStart} />}
        {step === "consent" && (
          <ConsentStep
            onAccept={handleConsentAccept}
            onDecline={() => setStep("start")}
          />
        )}
        {step === "test" && <TestRunner test={test} onSubmit={handleSubmit} />}
        {step === "certificate" && (
          <CertificateStep
            test={test}
            band={certBand}
            email={email}
            onDecline={() => setStep("done")}
          />
        )}
        {step === "done" && <DoneStep email={email} />}
      </div>
    </main>
  )
}
