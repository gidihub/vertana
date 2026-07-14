"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Loader2, Mail, UserPlus, X } from "lucide-react"
import { toast } from "sonner"

import type { TeamInviteView, TeamMemberView } from "@/lib/db/team"
import type { SeatUsage } from "@/lib/billing/seats"
import { useOrganization } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/format"

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
}

function SeatMeter({ seats }: { seats: SeatUsage }) {
  const unlimited = seats.total == null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        {seats.used} {unlimited ? "seats used" : `of ${seats.total} seats used`}
      </span>
      {!unlimited && seats.pendingInvites > 0 ? (
        <span>({seats.pendingInvites} pending)</span>
      ) : null}
      {!unlimited && !seats.canInvite ? (
        <span className="text-warning-foreground">
          · seat limit reached
        </span>
      ) : null}
    </div>
  )
}

export function TeamPanel() {
  const org = useOrganization()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMemberView[]>([])
  const [invites, setInvites] = useState<TeamInviteView[]>([])
  const [seats, setSeats] = useState<SeatUsage | null>(null)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"member" | "admin">("member")
  const [inviting, setInviting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/team")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load team")
      setMembers(data.members ?? [])
      setInvites(data.invites ?? [])
      setSeats(data.seats ?? null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setInviting(true)
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invite failed")
      toast.success(`Invite sent to ${trimmed}`)
      setEmail("")
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setInviting(false)
    }
  }

  async function revokeInvite(inviteId: string) {
    try {
      const res = await fetch(`/api/team?inviteId=${inviteId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not revoke invite")
      toast.success("Invite revoked")
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {org?.name ?? "Your organization"}
          </CardTitle>
          <CardDescription>
            Invite teammates to build assessments and review results together.
            {seats?.total != null
              ? ` Your plan includes ${seats.included} seats${
                  seats.extraSeats > 0 ? ` + ${seats.extraSeats} extra` : ""
                }.`
              : " No per-seat pricing."}
          </CardDescription>
          {seats ? <SeatMeter seats={seats} /> : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-sage text-xs text-ink">
                      {member.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invites</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[invite.role]} · expires{" "}
                      {formatDate(invite.expires_at)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => void revokeInvite(invite.id)}
                    aria-label={`Revoke invite for ${invite.email}`}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" />
            Invite teammate
          </CardTitle>
          <CardDescription>
            They will receive an email with a link to join your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seats && !seats.canInvite ? (
            <p className="mb-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              You&rsquo;ve used all {seats.total} seats. Upgrade your plan or add
              seats in Billing to invite more teammates.
            </p>
          ) : null}
          <form onSubmit={(e) => void handleInvite(e)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={inviting || (seats ? !seats.canInvite : false)}
              />
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "member" | "admin")}
                disabled={inviting || (seats ? !seats.canInvite : false)}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="self-start bg-pine text-pine-foreground hover:bg-pine-deep"
              disabled={inviting || (seats ? !seats.canInvite : false)}
            >
              {inviting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail data-icon="inline-start" />
              )}
              Send invite
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
