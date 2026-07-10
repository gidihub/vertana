import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import {
  createCandidateInvite,
  loadEmailInvitesForTest,
  loadTestById,
} from "@/lib/db/queries"

const inviteSchema = z.object({
  email: z.string().email(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    const { id } = await params
    const test = await loadTestById(id)
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    const invites = await loadEmailInvitesForTest(id)
    return NextResponse.json({ invites, uses_share_link: test.status === "active" })
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    try {
      const { id } = await params
      const body = inviteSchema.parse(await req.json())
      const invite = await createCandidateInvite({ testId: id, email: body.email })
      return NextResponse.json({ invite })
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 },
      )
    }
  })
}
