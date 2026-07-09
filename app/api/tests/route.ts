import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import {
  countNeedsScoringByTest,
  loadAllCandidates,
  loadTestsForOrg,
  saveTestRecord,
} from "@/lib/db/queries"
import type { Test } from "@/lib/types"

export async function GET() {
  return handleApiAuth(async () => {
    const [tests, candidates, needs_scoring] = await Promise.all([
      loadTestsForOrg(),
      loadAllCandidates(),
      countNeedsScoringByTest(),
    ])
    return NextResponse.json({ tests, candidates, needs_scoring })
  })
}

export async function POST(req: Request) {
  return handleApiAuth(async (ctx) => {
    try {
      const test = (await req.json()) as Test
      const saved = await saveTestRecord(test, {
        creatorEmail: ctx.user.email,
        creatorUserId: ctx.user.id,
      })
      return NextResponse.json({ test: saved })
    } catch (err) {
      const message = (err as Error).message
      const status =
        message.includes("credits") || message.includes("plan") ? 402 : 500
      return NextResponse.json({ error: message }, { status })
    }
  })
}
