import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { loadCandidateProfile } from "@/lib/db/queries"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  return handleApiAuth(async () => {
    const { email } = await params
    const decoded = decodeURIComponent(email)
    const profile = await loadCandidateProfile(decoded)
    if (profile.attempts.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }
    return NextResponse.json({ profile })
  })
}
