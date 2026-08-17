import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { requirePermission } from "@/lib/auth/permission-context"
import { auditRecruiterAction } from "@/lib/audit/events"
import {
  createTeamInvite,
  INVITABLE_TEAM_ROLES,
  loadTeamInvites,
  loadTeamMembers,
  revokeTeamInvite,
  type TeamInviteRole,
} from "@/lib/db/team"
import { getSeatUsage } from "@/lib/billing/seats"
import { getOrganization } from "@/lib/org"
import { ROLE_LABELS } from "@/lib/auth/permissions"

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(INVITABLE_TEAM_ROLES).default("recruiter"),
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
  return handleApiAuth(async ({ orgId, user }) => {
    await requirePermission("team.manage")

    try {
      const body = inviteSchema.parse(await req.json())
      const org = await getOrganization()
      const invite = await createTeamInvite({
        orgId,
        email: body.email,
        role: body.role as TeamInviteRole,
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
          metadata: {
            email: body.email,
            role: body.role,
            roleLabel: ROLE_LABELS[body.role],
          },
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
  return handleApiAuth(async ({ orgId }) => {
    await requirePermission("team.manage")

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
