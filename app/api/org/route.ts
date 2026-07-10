import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { getOrganization, ensureMonthlyResets } from "@/lib/org"

export async function GET() {
  return handleApiAuth(async ({ user }) => {
    const org = await ensureMonthlyResets(await getOrganization())
    return NextResponse.json({
      user_email: user.email ?? null,
      organization: {
        id: org.id,
        name: org.name,
        plan_tier: org.plan_tier,
        credits_remaining: org.credits_remaining,
        credits_reset_at: org.credits_reset_at,
        ai_generations_used: org.ai_generations_used,
        ai_generations_reset_at: org.ai_generations_reset_at,
        code_executions_used: org.code_executions_used,
        code_executions_reset_at: org.code_executions_reset_at,
        tab_switch_threshold: org.tab_switch_threshold ?? 3,
        stripe_customer_id: org.stripe_customer_id ?? null,
        stripe_subscription_id: org.stripe_subscription_id ?? null,
        subscription_status: org.subscription_status ?? null,
        billing_cycle: org.billing_cycle ?? null,
        current_period_end: org.current_period_end ?? null,
      },
    })
  })
}
