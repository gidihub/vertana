import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { getOrganization, ensureMonthlyResets } from "@/lib/org"

export async function GET() {
  return handleApiAuth(async () => {
    const org = await ensureMonthlyResets(await getOrganization())
    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        plan_tier: org.plan_tier,
        credits_remaining: org.credits_remaining,
        credits_reset_at: org.credits_reset_at,
        ai_generations_used: org.ai_generations_used,
        ai_generations_reset_at: org.ai_generations_reset_at,
      },
    })
  })
}
