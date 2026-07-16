import { cache } from "react"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { creditsForTier, type PlanTier } from "@/lib/plans"
import { isCompEmail } from "@/lib/comp"

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

/**
 * Resolves the current recruiter (auth user + org membership). Wrapped in React
 * `cache()` so the Supabase `auth.getUser()` validation and the `team_members`
 * lookup happen at most once per request, even though many query helpers call
 * this (directly or via `getOrgId`/`getOrganization`) dozens of times.
 */
export const requireRecruiter = cache(async () => {
  const supabase = await createClient()

  // `getClaims()` verifies the access-token JWT locally via the project's
  // (cached) signing keys instead of a network round-trip to the Auth server
  // like `getUser()`. It falls back to a network verification only when local
  // verification isn't possible, so it's never slower and removes ~hundreds of
  // ms of latency from every recruiter request. The middleware still gates
  // access on every protected route.
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) {
    throw new AuthError("Unauthorized")
  }

  const user = {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
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
})

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
  // Owners on an allowlisted domain get a complimentary org: unlimited credits
  // and all paid features, independent of plan_tier. See lib/comp.ts.
  const isComp = isCompEmail(input.email)
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: input.orgName.trim() || "My Organization",
      owner_id: input.userId,
      plan_tier: tier,
      credits_remaining: creditsForTier(tier),
      is_comp: isComp,
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
