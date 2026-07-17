import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import {
  countInvitesByTest,
  countNeedsScoringByTest,
  countOrgInviteFunnel,
  loadAllCandidates,
  loadTestsForOrg,
  saveTestRecord,
} from "@/lib/db/queries"
import type { Test } from "@/lib/types"

export async function GET() {
  return handleApiAuth(async (ctx) => {
    // Resolve the org's tests once and reuse them across the three aggregate
    // helpers, instead of each helper independently re-loading them.
    const tests = await loadTestsForOrg(ctx.orgId)
    const [candidates, needs_scoring, invite_counts, email_funnel] =
      await Promise.all([
        loadAllCandidates(tests),
        countNeedsScoringByTest(tests),
        countInvitesByTest(tests),
        countOrgInviteFunnel(tests),
      ])
    return NextResponse.json({
      tests,
      candidates,
      needs_scoring,
      invite_counts,
      email_funnel,
    })
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
      try {
        await auditRecruiterAction({
          orgId: ctx.orgId,
          userId: ctx.user.id,
          action: "test.created",
          resourceType: "test",
          resourceId: saved.id,
          metadata: { title: saved.title },
        })
      } catch {
        // Audit failure is logged in writeAuditLog; don't block test creation.
      }
      return NextResponse.json({ test: saved })
    } catch (err) {
      const message = (err as Error).message
      const status =
        message.includes("credits") || message.includes("plan") ? 402 : 500
      return NextResponse.json({ error: message }, { status })
    }
  })
}
