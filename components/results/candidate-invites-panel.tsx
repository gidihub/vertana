"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Link2, Loader2, Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import type { Test, TestInvite } from "@/lib/types"
import { refreshStore } from "@/lib/store"
import { formatDateTime } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function EmailStatusBadge({ invite }: { invite: TestInvite }) {
  if (invite.email_status === "sent") {
    return (
      <Badge variant="outline" className="border-pine/30 text-pine">
        Sent
      </Badge>
    )
  }
  if (invite.email_status === "failed") {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive">
        Failed
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      {invite.email_status === "pending" ? "Pending" : "—"}
    </Badge>
  )
}

export function CandidateInvitesPanel({
  test,
  onInvitesChange,
}: {
  test: Test
  onInvitesChange?: () => void
}) {
  const [invites, setInvites] = useState<TestInvite[]>([])
  const [usesShareLink, setUsesShareLink] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tests/${test.id}/invites`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load invites")
      setInvites(data.invites ?? [])
      setUsesShareLink(Boolean(data.uses_share_link))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [test.id])

  useEffect(() => {
    void load()
  }, [load])

  async function copyShareLink() {
    if (!test.token) {
      toast.error("Publish this test first to get a candidate link.")
      return
    }
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    try {
      await navigator.clipboard.writeText(`${origin}/t/${test.token}`)
      toast.success("Shared link copied")
    } catch {
      toast.error("Could not copy link to clipboard")
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setSending(true)
    try {
      const res = await fetch(`/api/tests/${test.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invite failed")

      const invite = data.invite as TestInvite
      if (invite.email_status === "failed") {
        toast.error(
          invite.email_error ?? "Invite saved but email failed to send.",
        )
      } else if (invite.email_status === "sent") {
        toast.success(`Invite sent to ${trimmed}`)
      } else {
        toast.message(`Invite created for ${trimmed}`)
      }

      setEmail("")
      await load()
      await refreshStore()
      onInvitesChange?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  async function resend(inviteId: string) {
    setResendingId(inviteId)
    try {
      const res = await fetch(
        `/api/tests/${test.id}/invites/${inviteId}/resend`,
        { method: "POST" },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Resend failed")

      const invite = data.invite as TestInvite
      if (invite.email_status === "failed") {
        toast.error(invite.email_error ?? "Email failed to send")
      } else {
        toast.success("Invite resent")
      }
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setResendingId(null)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-sage-line/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4" />
            Shared link
          </CardTitle>
          <CardDescription>
            One link for many candidates — copy and post anywhere. Does not
            count toward funnel &ldquo;Invited&rdquo; (email invites only).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {usesShareLink && test.token ? (
            <>
              <code className="block truncate rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/t/${test.token}`
                  : `/t/${test.token}`}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => void copyShareLink()}
              >
                <Link2 data-icon="inline-start" />
                Copy shared link
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Publish this test to activate the shared candidate link.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            Email invites
          </CardTitle>
          <CardDescription>
            Personal links sent by Vertana — each invite counts in the funnel and
            tracks send status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={(e) => void handleInvite(e)}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              placeholder="candidate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending || test.status !== "active"}
              required
            />
            <Button
              type="submit"
              className="shrink-0 bg-pine text-pine-foreground hover:bg-pine-deep"
              disabled={sending || test.status !== "active"}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail data-icon="inline-start" />
              )}
              Send invite
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No email invites yet. Send one above, or use the shared link for
              open distribution.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Email status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">
                        {invite.candidate_email}
                      </TableCell>
                      <TableCell>
                        <EmailStatusBadge invite={invite} />
                        {invite.email_status === "failed" && invite.email_error ? (
                          <p className="mt-1 max-w-[200px] truncate text-xs text-destructive">
                            {invite.email_error}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(invite.email_sent_at)}
                      </TableCell>
                      <TableCell>
                        {invite.email_status === "failed" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Resend invite to ${invite.candidate_email}`}
                            disabled={resendingId === invite.id}
                            onClick={() => void resend(invite.id)}
                          >
                            {resendingId === invite.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <RefreshCw className="size-4" />
                            )}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
