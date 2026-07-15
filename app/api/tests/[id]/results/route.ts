import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import {
  loadAttemptAnswers,
  loadCandidatesForTest,
  loadConsent,
  loadInviteFunnelStats,
  loadTestById,
} from "@/lib/db/queries"

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

    const candidates = await loadCandidatesForTest(id)
    const consents: Record<string, Awaited<ReturnType<typeof loadConsent>>> = {}
    const answers: Record<string, Awaited<ReturnType<typeof loadAttemptAnswers>>> =
      {}

    for (const c of candidates) {
      if (c.consent_id) {
        consents[c.consent_id] = await loadConsent(c.consent_id)
      }
      if (c.status === "submitted") {
        answers[c.id] = await loadAttemptAnswers(id, c.id)
      }
    }

    // Analytics are non-essential: never let a funnel-stats failure drop the
    // core results payload.
    let inviteStats: Awaited<ReturnType<typeof loadInviteFunnelStats>> | undefined
    try {
      inviteStats = await loadInviteFunnelStats(id)
    } catch (err) {
      console.error("Failed to load invite funnel stats:", err)
      inviteStats = undefined
    }

    return NextResponse.json({ test, candidates, consents, answers, inviteStats })
  })
}
