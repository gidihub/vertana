"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarClock,
  Clock,
  Link2,
  Loader2,
  Mail,
  Sparkles,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import type { BulkInviteResult } from "@/lib/db/queries"
import type { Test } from "@/lib/types"
import { refreshStore, useOrganization } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;\t]+/)
    .map((e) => e.trim())
    .filter(Boolean)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Pull anything that looks like an email out of arbitrary CSV/text content. */
function extractEmailsFromText(text: string): string[] {
  const matches = text.match(/[^\s,;"'<>]+@[^\s,;"'<>]+\.[^\s,;"'<>]+/g) ?? []
  return matches.map((m) => m.trim())
}

/** Convert a datetime-local value (local time) to an ISO string, or null. */
function localToIso(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function InviteCandidatesDialog({
  test,
  open,
  onOpenChange,
  onInvited,
}: {
  test: Test
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvited?: () => void
}) {
  const org = useOrganization()
  const orgDefaultReplyTo = org?.default_reply_to ?? ""
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [emailsInput, setEmailsInput] = useState("")
  const [deadline, setDeadline] = useState("")
  const [replyTo, setReplyTo] = useState("")
  const [replyToTouched, setReplyToTouched] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState("")
  const [sending, setSending] = useState(false)
  const [generatingMessage, setGeneratingMessage] = useState(false)
  const [copied, setCopied] = useState(false)

  // Prefill reply-to with the org default whenever the dialog opens, unless the
  // recruiter has already edited the field this session.
  useEffect(() => {
    if (open && !replyToTouched) {
      setReplyTo(orgDefaultReplyTo)
    }
  }, [open, orgDefaultReplyTo, replyToTouched])

  const shareUrl = useMemo(() => {
    if (!test.token) return ""
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/t/${test.token}`
  }, [test.token])

  const emails = useMemo(() => parseEmails(emailsInput), [emailsInput])
  const invalidEmails = emails.filter((e) => !EMAIL_RE.test(e))
  const canSend =
    test.status === "active" &&
    emails.length > 0 &&
    invalidEmails.length === 0 &&
    (!scheduleEnabled || Boolean(scheduledAt))

  function reset() {
    setEmailsInput("")
    setDeadline("")
    setReplyTo(orgDefaultReplyTo)
    setReplyToTouched(false)
    setSubject("")
    setMessage("")
    setScheduleEnabled(false)
    setScheduledAt("")
  }

  async function handleCsv(file: File) {
    try {
      const text = await file.text()
      const found = extractEmailsFromText(text)
      if (found.length === 0) {
        toast.error("No email addresses found in that file.")
        return
      }
      // Merge with whatever is already typed, de-duplicating case-insensitively.
      const existing = parseEmails(emailsInput)
      const seen = new Set(existing.map((e) => e.toLowerCase()))
      const additions = found.filter((e) => {
        const key = e.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      const merged = [...existing, ...additions]
      setEmailsInput(merged.join("\n"))
      toast.success(
        `Added ${additions.length} email${additions.length === 1 ? "" : "s"} from ${file.name}`,
      )
    } catch {
      toast.error("Could not read that file.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function generateMessage() {
    setGeneratingMessage(true)
    try {
      const res = await fetch(`/api/tests/${test.id}/invite-message`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not generate a message")
      setMessage(String(data.message ?? "").trim())
      toast.success("Message drafted with AI")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setGeneratingMessage(false)
    }
  }

  async function copyShareLink() {
    if (!shareUrl) {
      toast.error("Publish this test first to get a candidate link.")
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success("Shared link copied")
    } catch {
      toast.error("Could not copy link to clipboard")
    }
  }

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    try {
      const scheduleIso = scheduleEnabled ? localToIso(scheduledAt) : null
      const res = await fetch(`/api/tests/${test.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails,
          deadlineAt: localToIso(deadline),
          replyTo: replyTo.trim() || null,
          subject: subject.trim() || null,
          message: message.trim() || null,
          scheduledAt: scheduleIso,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invite failed")

      const results = (data.results ?? []) as BulkInviteResult[]
      const ok = results.filter((r) => r.ok)
      const failed = results.filter((r) => !r.ok)

      if (ok.length > 0) {
        const verb = scheduleIso ? "scheduled" : "sent"
        toast.success(
          `${ok.length} invite${ok.length === 1 ? "" : "s"} ${verb}`,
        )
      }
      if (failed.length > 0) {
        toast.error(
          `${failed.length} failed: ${failed
            .slice(0, 3)
            .map((r) => `${r.email} (${r.error})`)
            .join(", ")}${failed.length > 3 ? "…" : ""}`,
        )
      }
      if (ok.length === 0 && failed.length === 0) {
        toast.message("No new invites created.")
      }

      await refreshStore()
      onInvited?.()
      if (failed.length === 0) {
        reset()
        onOpenChange(false)
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite candidates</DialogTitle>
          <DialogDescription>
            Send personal email invites or share one open link for {test.title}.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email">
          <TabsList className="w-full">
            <TabsTrigger value="email">
              <Mail data-icon="inline-start" />
              Email
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 data-icon="inline-start" />
              Shared URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="pt-4">
            {test.status !== "active" ? (
              <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Publish this test before inviting candidates by email.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="invite-emails">Candidate emails</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,text/csv,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleCsv(file)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload data-icon="inline-start" />
                      Upload CSV
                    </Button>
                  </div>
                  <Textarea
                    id="invite-emails"
                    placeholder={"candidate@company.com\nanother@company.com"}
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    className="min-h-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    One per line (or comma-separated).
                    {emails.length > 0 ? (
                      <>
                        {" "}
                        {emails.length} recipient
                        {emails.length === 1 ? "" : "s"}.
                      </>
                    ) : null}
                    {invalidEmails.length > 0 ? (
                      <span className="text-destructive">
                        {" "}
                        Invalid: {invalidEmails.slice(0, 3).join(", ")}
                        {invalidEmails.length > 3 ? "…" : ""}
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-deadline">Deadline (optional)</Label>
                    <Input
                      id="invite-deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-replyto">Reply-to (optional)</Label>
                    <Input
                      id="invite-replyto"
                      type="email"
                      placeholder="recruiting@company.com"
                      value={replyTo}
                      onChange={(e) => {
                        setReplyToTouched(true)
                        setReplyTo(e.target.value)
                      }}
                    />
                    {orgDefaultReplyTo ? (
                      <p className="text-xs text-muted-foreground">
                        Prefilled from your workspace default.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invite-subject">Subject (optional)</Label>
                  <Input
                    id="invite-subject"
                    placeholder={`You're invited: ${test.title}`}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="invite-message">Message (optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={generatingMessage}
                      onClick={() => void generateMessage()}
                    >
                      {generatingMessage ? (
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                      ) : (
                        <Sparkles data-icon="inline-start" />
                      )}
                      {generatingMessage
                        ? "Generating…"
                        : message
                          ? "Regenerate with AI"
                          : "Generate with AI"}
                    </Button>
                  </div>
                  <Textarea
                    id="invite-message"
                    placeholder="Add a personal note shown at the top of the email."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                <div className="rounded-lg border border-border p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      className="size-4 accent-pine"
                      checked={scheduleEnabled}
                      onChange={(e) => setScheduleEnabled(e.target.checked)}
                    />
                    <CalendarClock className="size-4" />
                    Schedule for later
                  </label>
                  {scheduleEnabled ? (
                    <div className="mt-3 space-y-1.5">
                      <Label htmlFor="invite-schedule">Send at</Label>
                      <Input
                        id="invite-schedule"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Emails are delivered within ~5 minutes of this time.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="pt-4">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                One link for many candidates — post it on job boards or share
                directly. Anyone with the link can start the assessment.
              </p>
              {shareUrl ? (
                <>
                  <code className="block truncate rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">
                    {shareUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => void copyShareLink()}
                  >
                    <Link2 data-icon="inline-start" />
                    {copied ? "Copied" : "Copy shared link"}
                  </Button>
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    Shared-link candidates don&rsquo;t count toward the
                    &ldquo;Invited&rdquo; funnel.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Publish this test to activate the shared candidate link.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-pine text-pine-foreground hover:bg-pine-deep"
            disabled={!canSend || sending}
            onClick={() => void handleSend()}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail data-icon="inline-start" />
            )}
            {scheduleEnabled ? "Schedule invites" : "Send invites"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
