import { NextResponse } from "next/server"

import { loadTestByToken } from "@/lib/db/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isCameraProctoringEnabled,
  proctoringPolicyForTier,
} from "@/lib/proctoring/config"
import type { PlanTier } from "@/lib/plans"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const loaded = await loadTestByToken(token)
    if (!loaded) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 })
    }

    // Resolve the org's plan-tier proctoring policy (interval + cap) so the
    // candidate app captures at a cadence proportional to the plan. Only sent
    // when camera proctoring is enabled for a proctored test.
    let proctoringPolicy: { intervalMs: number; maxSnapshots: number } | null =
      null
    if (loaded.test.requires_proctoring && isCameraProctoringEnabled()) {
      const admin = createAdminClient()
      const { data: org } = await admin
        .from("organizations")
        .select("plan_tier, is_comp")
        .eq("id", loaded.test.org_id!)
        .maybeSingle()
      const tier: PlanTier = org?.is_comp
        ? "custom"
        : ((org?.plan_tier as PlanTier) ?? "starter")
      const policy = proctoringPolicyForTier(tier)
      proctoringPolicy = {
        intervalMs: policy.intervalMs,
        maxSnapshots: policy.maxSnapshots,
      }
    }

    return NextResponse.json({
      test: loaded.test,
      inviteId: loaded.invite.id,
      proctoringPolicy,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
