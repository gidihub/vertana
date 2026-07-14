import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import { revokeCandidateInvite } from "@/lib/db/queries"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  return handleApiAuth(async (ctx) => {
    try {
      const { id, inviteId } = await params
      const invite = await revokeCandidateInvite(inviteId)
      try {
        await auditRecruiterAction({
          orgId: ctx.orgId,
          userId: ctx.user.id,
          action: "invite.revoked",
          resourceType: "test_invite",
          resourceId: inviteId,
          metadata: { testId: id, email: invite.candidate_email },
        })
      } catch {
        // Audit failure is logged in writeAuditLog; don't block revoke.
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
