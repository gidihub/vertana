"use client"

import { useState } from "react"
import { Clock, ListChecks, CalendarClock, ShieldCheck, ArrowRight } from "lucide-react"

import type { Test } from "@/lib/types"
import { formatDate } from "@/lib/format"
import { formatAllottedTimeLabel } from "@/lib/test-timing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function StartStep({
  test,
  onStart,
}: {
  test: Test
  onStart: (email: string) => void
}) {
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const valid = isValidEmail(email)

  const facts = [
    { icon: ListChecks, label: `${test.questions.length} questions` },
    { icon: Clock, label: `${formatAllottedTimeLabel(test)} allotted` },
    {
      icon: CalendarClock,
      label: test.deadline ? `Due ${formatDate(test.deadline)}` : "No deadline",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-2xl text-balance">{test.title}</CardTitle>
        {test.description && (
          <CardDescription className="text-pretty">
            {test.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {facts.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
            >
              <f.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">What to expect</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            <li>The timer starts as soon as you begin and can&apos;t be paused.</li>
            <li>Answer each question, then submit at the end.</li>
            {test.forbid_ai_tools && (
              <li>
                Please complete this assessment without AI assistants (such as
                ChatGPT or Copilot). Your answers should reflect your own
                knowledge and skills.
              </li>
            )}
            {test.requires_proctoring && (
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                This assessment is proctored — you&apos;ll review consent next.
              </li>
            )}
          </ul>
        </div>

        <Field data-invalid={touched && !valid ? true : undefined}>
          <FieldLabel htmlFor="candidate-email">Your email</FieldLabel>
          <Input
            id="candidate-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            aria-invalid={touched && !valid ? true : undefined}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          <FieldDescription>
            {touched && !valid
              ? "Enter a valid email address to continue."
              : "We use this to match your results to your application."}
          </FieldDescription>
        </Field>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full sm:w-auto"
          disabled={!valid}
          onClick={() => onStart(email.trim())}
        >
          {test.requires_proctoring ? "Continue" : "Start assessment"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
