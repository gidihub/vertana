import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { createAdminClient } from "@/lib/supabase/admin"
import { proctoringPolicyForTier } from "@/lib/proctoring/config"
import type { PlanTier } from "@/lib/plans"

const schema = z.object({
  // null = use the plan-tier default retention window.
  days: z.number().int().min(1).max(3650).nullable(),
})

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can change data retention" },
        { status: 403 },
      )
    }

    let body: z.infer<typeof schema>
    try {
      body = schema.parse(await req.json())
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    const admin = createAdminClient()

    // Clamp the requested window to the org's plan-tier maximum so retention —
    // and the storage cost it drives — stays within what the plan allows.
    const { data: org } = await admin
      .from("organizations")
      .select("plan_tier, is_comp")
      .eq("id", orgId)
      .maybeSingle()
    const tier: PlanTier = org?.is_comp
      ? "custom"
      : ((org?.plan_tier as PlanTier) ?? "starter")
    const maxDays = proctoringPolicyForTier(tier).maxRetentionDays
    const days = body.days === null ? null : Math.min(body.days, maxDays)

    const { error } = await admin
      .from("organizations")
      .update({ data_retention_days: days })
      .eq("id", orgId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data_retention_days: days,
      max_retention_days: maxDays,
    })
  })
}
