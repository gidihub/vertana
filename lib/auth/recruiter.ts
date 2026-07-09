import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { creditsForTier, type PlanTier } from "@/lib/plans"

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export async function requireRecruiter() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError("Unauthorized")
  }

  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (memberError || !member) {
    throw new AuthError("No organization membership", 403)
  }

  return {
    supabase,
    user,
    orgId: member.org_id as string,
    role: member.role as string,
  }
}

export async function setupOrganizationForUser(input: {
  userId: string
  orgName: string
  email?: string | null
}) {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from("team_members")
    .select("org_id")
    .eq("user_id", input.userId)
    .maybeSingle()

  if (existing) {
    const { data: org } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", existing.org_id)
      .single()
    return { orgId: existing.org_id as string, orgName: org?.name ?? input.orgName }
  }

  if (input.email) {
    const { tryAcceptPendingInviteForEmail } = await import("@/lib/db/team")
    const joined = await tryAcceptPendingInviteForEmail({
      userId: input.userId,
      userEmail: input.email,
    })
    if (joined) return joined
  }

  // Dev-only: sets plan_tier when a new org is created at signup. Once Stripe/
  // billing is wired, plan_tier will be set in the database at checkout and this
  // env var has no effect on existing organizations.
  const tier = (process.env.VERTANA_PLAN_TIER as PlanTier) || "free"
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: input.orgName.trim() || "My Organization",
      owner_id: input.userId,
      plan_tier: tier,
      credits_remaining: creditsForTier(tier),
    })
    .select("id, name")
    .single()

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization")
  }

  await admin.from("team_members").insert({
    org_id: org.id,
    user_id: input.userId,
    role: "owner",
  })

  return { orgId: org.id, orgName: org.name }
}
