import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import {
  loadAttemptAnswers,
  loadCandidatesForTest,
  loadConsent,
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

    return NextResponse.json({ test, candidates, consents, answers })
  })
}
