"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import type { TimingPolicy } from "@/lib/types"
import { TIMING_POLICY_OPTIONS } from "@/lib/test-timing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
} from "@/components/ui/field"
import { cn } from "@/lib/utils"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function TestSettingsSection({
  timingPolicy,
  onTimingPolicyChange,
  forbidAiTools,
  onForbidAiToolsChange,
  notifyEmails,
  onNotifyEmailsChange,
  defaultCreatorEmail,
}: {
  timingPolicy: TimingPolicy
  onTimingPolicyChange: (value: TimingPolicy) => void
  forbidAiTools: boolean
  onForbidAiToolsChange: (value: boolean) => void
  notifyEmails: string[]
  onNotifyEmailsChange: (emails: string[]) => void
  defaultCreatorEmail?: string
}) {
  const [emailInput, setEmailInput] = useState("")

  function addEmail() {
    const next = emailInput.trim().toLowerCase()
    if (!next) return
    if (!isValidEmail(next)) {
      toast.error("Enter a valid email address")
      return
    }
    if (notifyEmails.includes(next)) {
      toast.error("That email is already on the list")
      return
    }
    onNotifyEmailsChange([...notifyEmails, next])
    setEmailInput("")
  }

  function removeEmail(email: string) {
    onNotifyEmailsChange(notifyEmails.filter((item) => item !== email))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Integrity policy, timing accommodation, and completion notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Field>
          <FieldLabel>Timing policy</FieldLabel>
          <FieldDescription className="mb-3">
            Adjusts the countdown timer candidates see. The base time limit is
            set in Details above.
          </FieldDescription>
          <RadioGroup
            value={timingPolicy}
            onValueChange={(value) =>
              onTimingPolicyChange(value as TimingPolicy)
            }
            className="gap-3"
          >
            {TIMING_POLICY_OPTIONS.map((option) => (
              <label
                key={option.value}
                htmlFor={`timing-${option.value}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3 transition-colors",
                  timingPolicy === option.value && "border-primary/40 bg-primary/5",
                )}
              >
                <RadioGroupItem
                  id={`timing-${option.value}`}
                  value={option.value}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </Field>

        <Separator />

        <Field orientation="horizontal">
          <FieldLabel htmlFor="forbid-ai" className="flex-1">
            Forbid use of AI tools during this test
            <FieldDescription>
              Candidates will see a plain-language notice before they start.
              This is a policy disclosure — not technical enforcement.
            </FieldDescription>
          </FieldLabel>
          <Switch
            id="forbid-ai"
            checked={forbidAiTools}
            onCheckedChange={onForbidAiToolsChange}
          />
        </Field>

        {forbidAiTools && (
          <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
            Policy status: <strong>AI tools not permitted</strong> — shown to
            candidates on the pre-test screen and on the results dashboard.
          </p>
        )}

        <Separator />

        <Field>
          <FieldLabel htmlFor="notify-email">Notify on completion</FieldLabel>
          <FieldDescription className="mb-3">
            These addresses receive an email when any candidate submits this
            test.
            {!notifyEmails.length && defaultCreatorEmail
              ? ` Defaults to ${defaultCreatorEmail} if left empty.`
              : null}
          </FieldDescription>
          <div className="flex flex-wrap gap-2">
            <Input
              id="notify-email"
              type="email"
              placeholder="recruiter@company.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addEmail()
                }
              }}
              className="max-w-sm flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addEmail}>
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </div>
          {notifyEmails.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {notifyEmails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span>{email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${email}`}
                    onClick={() => removeEmail(email)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              No notification emails yet.
              {defaultCreatorEmail
                ? ` Your account email (${defaultCreatorEmail}) will be used on save.`
                : null}
            </p>
          )}
        </Field>
      </CardContent>
    </Card>
  )
}
