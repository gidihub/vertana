import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { loadProctoringMedia } from "@/lib/db/queries"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
) {
  return handleApiAuth(async () => {
    const { id, attemptId } = await params
    const media = await loadProctoringMedia(id, attemptId)
    return NextResponse.json({ media })
  })
}
