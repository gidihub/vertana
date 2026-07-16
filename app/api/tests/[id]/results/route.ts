import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import {
  loadAnswersForAttempts,
  loadCandidatesForTest,
  loadConsentsForTest,
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
    const submittedIds = candidates
      .filter((c) => c.status === "submitted")
      .map((c) => c.id)
    const consentIds = candidates
      .map((c) => c.consent_id)
      .filter((cid): cid is string => Boolean(cid))

    // Consents, answers, and (non-essential) funnel analytics fetch in parallel;
    // a funnel-stats failure must never drop the core results payload.
    const [consents, answers, inviteStats] = await Promise.all([
      loadConsentsForTest(id, consentIds),
      loadAnswersForAttempts(test, submittedIds),
      loadInviteFunnelStats(id).catch((err) => {
        console.error("Failed to load invite funnel stats:", err)
        return undefined
      }),
    ])

    return NextResponse.json({ test, candidates, consents, answers, inviteStats })
  })
}
