import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import {
  createTeamInvite,
  loadTeamInvites,
  loadTeamMembers,
  revokeTeamInvite,
} from "@/lib/db/team"
import { getSeatUsage } from "@/lib/billing/seats"
import { getOrganization } from "@/lib/org"

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
})

export async function GET() {
  return handleApiAuth(async ({ orgId, role }) => {
    const [members, invites, seats] = await Promise.all([
      loadTeamMembers(orgId),
      loadTeamInvites(orgId),
      getSeatUsage(orgId),
    ])
    return NextResponse.json({
      members,
      invites,
      seats,
      canManageSeats: role === "owner",
    })
  })
}

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, user, role: callerRole }) => {
    if (callerRole !== "owner" && callerRole !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can invite teammates" },
        { status: 403 },
      )
    }

    try {
      const body = inviteSchema.parse(await req.json())
      const org = await getOrganization()
      const invite = await createTeamInvite({
        orgId,
        email: body.email,
        role: body.role,
        invitedByUserId: user.id,
        inviterEmail: user.email ?? "A teammate",
        orgName: org.name,
      })
      try {
        await auditRecruiterAction({
          orgId,
          userId: user.id,
          action: "team.invite_created",
          resourceType: "team_invite",
          resourceId: invite.id,
          metadata: { email: body.email, role: body.role },
        })
      } catch {
        // Audit failure is logged in writeAuditLog; don't block team invite.
      }
      return NextResponse.json({ invite })
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 },
      )
    }
  })
}

export async function DELETE(req: Request) {
  return handleApiAuth(async ({ orgId, role: callerRole }) => {
    if (callerRole !== "owner" && callerRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const inviteId = searchParams.get("inviteId")
    if (!inviteId) {
      return NextResponse.json({ error: "inviteId is required" }, { status: 400 })
    }

    try {
      await revokeTeamInvite(orgId, inviteId)
      return NextResponse.json({ ok: true })
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 },
      )
    }
  })
}
