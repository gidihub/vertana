import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { resendCandidateInvite } from "@/lib/db/queries"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  return handleApiAuth(async () => {
    try {
      const { inviteId } = await params
      const invite = await resendCandidateInvite(inviteId)
      return NextResponse.json({ invite })
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 },
      )
    }
  })
}
