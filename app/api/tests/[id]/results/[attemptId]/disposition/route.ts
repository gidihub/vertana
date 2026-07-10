import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { updateAttemptDisposition } from "@/lib/db/queries"
import type { CandidateDisposition } from "@/lib/types"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
) {
  const result = await handleApiAuth(async () => {
    const { id, attemptId } = await params
    const { disposition } = (await req.json()) as {
      disposition: CandidateDisposition
    }

    if (
      !disposition ||
      !["under_review", "shortlisted", "rejected", "hired"].includes(
        disposition,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid disposition" },
        { status: 400 },
      )
    }

    const candidate = await updateAttemptDisposition({
      testId: id,
      attemptId,
      disposition,
    })
    return NextResponse.json({ candidate })
  })
  return result
}
