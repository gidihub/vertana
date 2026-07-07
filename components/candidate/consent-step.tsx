"use client"

import { useState } from "react"
import {
  ShieldCheck,
  Video,
  Monitor,
  ScanFace,
  Users,
  Clock,
  Lock,
} from "lucide-react"

import { CONSENT_COPY, CONSENT_DECLINED_MESSAGE } from "@/lib/consent"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Field, FieldLabel } from "@/components/ui/field"

const POINT_ICONS = [Video, ScanFace, Users, Clock]

export function ConsentStep({
  onAccept,
  onDecline,
}: {
  onAccept: () => void
  onDecline: () => void
}) {
  const [checked, setChecked] = useState(false)
  const [declined, setDeclined] = useState(false)

  if (declined) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Assessment can&apos;t continue</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock />
            <AlertTitle>Consent required</AlertTitle>
            <AlertDescription>{CONSENT_DECLINED_MESSAGE}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setDeclined(false)}>
            Go back
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <CardTitle className="text-balance">{CONSENT_COPY.title}</CardTitle>
        <CardDescription className="text-pretty">
          {CONSENT_COPY.intro}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <ul className="flex flex-col gap-4">
          {CONSENT_COPY.points.map((point, i) => {
            const Icon = POINT_ICONS[i] ?? Monitor
            return (
              <li key={point.heading} className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{point.heading}</p>
                  <p className="text-sm text-muted-foreground text-pretty">
                    {point.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <Field orientation="horizontal">
            <Checkbox
              id="consent-check"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-0.5"
            />
            <FieldLabel
              htmlFor="consent-check"
              className="text-sm font-normal leading-relaxed"
            >
              I have read the above and I consent to being recorded and verified
              for the purpose of this assessment.
            </FieldLabel>
          </Field>
        </div>
      </CardContent>

      <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={() => setDeclined(true)}>
          {CONSENT_COPY.declineLabel}
        </Button>
        <Button disabled={!checked} onClick={onAccept}>
          {CONSENT_COPY.acceptLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
