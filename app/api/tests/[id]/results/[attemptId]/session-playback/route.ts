import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { loadSessionPlayback } from "@/lib/db/queries"

/**
 * Session playback model (camera frames joined to the per-question timing log)
 * for one attempt. Same RBAC as viewing candidate results — signed camera URLs
 * are built here, so this is only called when the recruiter expands the card.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
) {
  return handleApiAuth(async () => {
    const { id, attemptId } = await params
    const playback = await loadSessionPlayback(id, attemptId)
    return NextResponse.json({ playback })
  })
}
