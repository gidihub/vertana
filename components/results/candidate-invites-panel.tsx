"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BellRing,
  CalendarClock,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  UserPlus,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import type { Test, TestInvite } from "@/lib/types"
import { refreshStore } from "@/lib/store"
import { formatDate, formatDateTime } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { InviteCandidatesDialog } from "@/components/results/invite-candidates-dialog"

function InviteStatusBadge({ invite }: { invite: TestInvite }) {
  if (invite.status === "revoked") {
    return <Badge variant="secondary">Revoked</Badge>
  }
  if (invite.email_status === "scheduled") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
        Scheduled
      </Badge>
    )
  }
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

function InviteReminders({ invite }: { invite: TestInvite }) {
  const sent: string[] = []
  if (invite.reminder_not_started_at) {
    sent.push(`Not-started reminder · ${formatDateTime(invite.reminder_not_started_at)}`)
  }
  if (invite.reminder_deadline_at) {
    sent.push(`Deadline reminder · ${formatDateTime(invite.reminder_deadline_at)}`)
  }

  if (sent.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-muted-foreground"
      title={sent.join("\n")}
    >
      <BellRing className="size-3.5 text-pine" />
      {sent.length}
    </span>
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [resendingAll, setResendingAll] = useState(false)

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

  const failedInvites = invites.filter(
    (i) => i.status === "active" && i.email_status === "failed",
  )

  async function resendAllFailed() {
    if (failedInvites.length === 0) return
    setResendingAll(true)
    let ok = 0
    let failed = 0
    try {
      // Bounded concurrency so we don't hammer the email provider at once.
      const queue = [...failedInvites]
      const CONCURRENCY = 3
      async function worker() {
        while (queue.length > 0) {
          const invite = queue.shift()
          if (!invite) return
          try {
            const res = await fetch(
              `/api/tests/${test.id}/invites/${invite.id}/resend`,
              { method: "POST" },
            )
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Resend failed")
            if ((data.invite as TestInvite)?.email_status === "failed") failed += 1
            else ok += 1
          } catch {
            failed += 1
          }
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, failedInvites.length) }, () =>
          worker(),
        ),
      )
      if (ok > 0) toast.success(`${ok} invite${ok === 1 ? "" : "s"} resent`)
      if (failed > 0)
        toast.error(`${failed} still failed — check the error on each row.`)
      await load()
    } finally {
      setResendingAll(false)
    }
  }

  async function revoke(inviteId: string) {
    setRevokingId(inviteId)
    try {
      const res = await fetch(`/api/tests/${test.id}/invites/${inviteId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Revoke failed")
      toast.success("Invite revoked")
      await load()
      await refreshStore()
      onInvitesChange?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <>
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
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="size-4" />
                  Email invites
                </CardTitle>
                <CardDescription>
                  Personal links sent by Vertana — each invite counts in the
                  funnel and tracks send status.
                </CardDescription>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {failedInvites.length > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
                    disabled={resendingAll || test.status !== "active"}
                    onClick={() => void resendAllFailed()}
                  >
                    {resendingAll ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <RefreshCw data-icon="inline-start" />
                    )}
                    Resend failed ({failedInvites.length})
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className="bg-pine text-pine-foreground hover:bg-pine-deep"
                  disabled={test.status !== "active"}
                  onClick={() => setDialogOpen(true)}
                >
                  <UserPlus data-icon="inline-start" />
                  Invite
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No email invites yet. Invite candidates above, or use the shared
                link for open distribution.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Sent / scheduled</TableHead>
                      <TableHead>Reminders</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const isActive = invite.status === "active"
                      const canResend =
                        isActive &&
                        (invite.email_status === "failed" ||
                          invite.email_status === "sent")
                      return (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">
                            {invite.candidate_email}
                          </TableCell>
                          <TableCell>
                            <InviteStatusBadge invite={invite} />
                            {invite.email_status === "failed" &&
                            invite.email_error ? (
                              <p className="mt-1 max-w-[200px] truncate text-xs text-destructive">
                                {invite.email_error}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {invite.expires_at
                              ? formatDate(invite.expires_at)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {invite.email_status === "scheduled" ? (
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="size-3.5" />
                                {formatDateTime(invite.scheduled_at)}
                              </span>
                            ) : (
                              formatDateTime(invite.email_sent_at)
                            )}
                          </TableCell>
                          <TableCell>
                            <InviteReminders invite={invite} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {canResend ? (
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
                              {isActive ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Revoke invite for ${invite.candidate_email}`}
                                  disabled={revokingId === invite.id}
                                  onClick={() => void revoke(invite.id)}
                                >
                                  {revokingId === invite.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <XCircle className="size-4 text-muted-foreground" />
                                  )}
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteCandidatesDialog
        test={test}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onInvited={() => {
          void load()
          onInvitesChange?.()
        }}
      />
    </>
  )
}
