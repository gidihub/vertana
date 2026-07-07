"use client"

import { useState } from "react"
import Link from "next/link"
import { Award, ArrowRight, ArrowLeft, ShieldCheck, Eye } from "lucide-react"
import { toast } from "sonner"

import type { Certificate, Test } from "@/lib/types"
import { issueCertificate } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"

type Phase = "offer" | "confirm" | "issued"

export function CertificateStep({
  test,
  token,
  attemptId,
  band,
  email,
  onDecline,
}: {
  test: Test
  token: string
  attemptId: string
  band: string
  email: string
  onDecline: () => void
}) {
  const [phase, setPhase] = useState<Phase>("offer")
  const [optIn, setOptIn] = useState(false)
  const [name, setName] = useState("")
  const [confirmEmail, setConfirmEmail] = useState(email)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [issuing, setIssuing] = useState(false)

  async function handleIssue() {
    if (!name.trim() || issuing) return
    setIssuing(true)
    try {
      const cert = await issueCertificate({
        token,
        attemptId,
        candidateName: name,
      })
      setCertificate({
        ...cert,
        candidate_email: confirmEmail,
        test_id: test.id,
        skill_name: test.title,
        percentile_band: band,
      })
      setPhase("issued")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIssuing(false)
    }
  }

  if (phase === "issued" && certificate) {
    return (
      <Card className="text-center">
        <CardHeader className="items-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="size-7" />
          </div>
          <CardTitle className="text-balance">Your certificate is ready</CardTitle>
          <CardDescription className="text-pretty">
            It has been issued to {certificate.candidate_name}. You can view and
            share it any time using its public link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            nativeButton={false}
            render={<Link href={`/certificate/${certificate.slug}`} />}
          >
            <Eye data-icon="inline-start" />
            View your certificate
          </Button>
          <p className="text-sm text-muted-foreground text-pretty">
            Your responses have also been recorded for the hiring team. You can
            safely close this window.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (phase === "confirm") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Confirm your details</CardTitle>
          <CardDescription className="text-pretty">
            These appear on your public certificate. Your email stays private and
            is only used if you ask us to remove it later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="cert-name">Full name</FieldLabel>
            <Input
              id="cert-name"
              placeholder="e.g. Alex Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="cert-email">Email</FieldLabel>
            <Input
              id="cert-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
        </CardContent>
        <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={() => setPhase("offer")}>
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
          <Button onClick={handleIssue} disabled={!name.trim() || issuing}>
            Issue my certificate
            <ArrowRight data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Award className="size-7" />
        </div>
        <CardTitle className="text-balance">
          You qualified for a certificate
        </CardTitle>
        <CardDescription className="text-pretty">
          You finished in the {band} for {test.title}. You can claim a public,
          shareable certificate that proves it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="size-4 text-muted-foreground" />
            What will be public
          </div>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
              Your name
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
              The skill assessed ({test.title})
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
              Your percentile band ({band})
            </li>
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-md bg-background p-3 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-muted-foreground text-pretty">
              We never show the employer&apos;s identity or your raw score. Only
              the skill name and percentile band above are public.
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
          <Checkbox
            checked={optIn}
            onCheckedChange={(v) => setOptIn(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-pretty">
            I&apos;d like a shareable certificate
          </span>
        </label>
      </CardContent>
      <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onDecline}>
          No thanks
        </Button>
        <Button disabled={!optIn} onClick={() => setPhase("confirm")}>
          Continue
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
