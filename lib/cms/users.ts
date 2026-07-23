import { createAdminClient } from "@/lib/supabase/admin"

/** A single platform user, joined to their org membership + plan. */
export type CmsUserRow = {
  id: string
  email: string
  name: string | null
  orgName: string | null
  role: "owner" | "admin" | "member" | null
  planTier: string | null
  createdAt: string
}

export type CmsUserAnalytics = {
  totalUsers: number
  organizations: number
  newThisMonth: number
  newLastMonth: number
  newThisWeek: number
  planBreakdown: Array<{ tier: string; count: number }>
  recentSignups: CmsUserRow[]
}

type AuthUser = {
  id: string
  email: string | null
  created_at: string
  metadata: Record<string, unknown>
}

/** Label bucket for users that aren't attached to an organization yet. */
const NO_PLAN_LABEL = "No org"

/** Fetch every Supabase Auth user, paging through the admin API. */
async function listAllAuthUsers(): Promise<AuthUser[]> {
  const admin = createAdminClient()
  const perPage = 1000
  const all: AuthUser[] = []
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data.users ?? []
    for (const u of users) {
      all.push({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        metadata: (u.user_metadata as Record<string, unknown>) ?? {},
      })
    }
    if (users.length < perPage) break
    page += 1
  }

  return all
}

/** Pull a human display name out of auth metadata, else null. */
function displayName(metadata: Record<string, unknown>): string | null {
  for (const key of ["full_name", "name", "display_name"]) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

export async function getCmsUserAnalytics(): Promise<CmsUserAnalytics> {
  const admin = createAdminClient()

  const [authUsers, membershipsRes, orgsRes] = await Promise.all([
    listAllAuthUsers(),
    admin.from("team_members").select("user_id, org_id, role"),
    admin.from("organizations").select("id, name, plan_tier"),
  ])

  if (membershipsRes.error) throw membershipsRes.error
  if (orgsRes.error) throw orgsRes.error

  const orgById = new Map(
    (orgsRes.data ?? []).map((o) => [
      o.id as string,
      { name: o.name as string, planTier: o.plan_tier as string },
    ]),
  )

  const membershipByUser = new Map(
    (membershipsRes.data ?? []).map((m) => [
      m.user_id as string,
      { orgId: m.org_id as string, role: m.role as CmsUserRow["role"] },
    ]),
  )

  const now = Date.now()
  const monthStart = new Date()
  monthStart.setHours(0, 0, 0, 0)
  monthStart.setDate(1)
  const monthStartMs = monthStart.getTime()

  const lastMonthStart = new Date(monthStart)
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
  const lastMonthStartMs = lastMonthStart.getTime()

  const weekAgoMs = now - 7 * 86400000

  let newThisMonth = 0
  let newLastMonth = 0
  let newThisWeek = 0
  const planCounts = new Map<string, number>()

  const rows: CmsUserRow[] = authUsers.map((user) => {
    const membership = membershipByUser.get(user.id)
    const org = membership ? orgById.get(membership.orgId) : undefined
    const planTier = org?.planTier ?? null

    const createdMs = new Date(user.created_at).getTime()
    if (createdMs >= monthStartMs) newThisMonth += 1
    else if (createdMs >= lastMonthStartMs) newLastMonth += 1
    if (createdMs >= weekAgoMs) newThisWeek += 1

    const bucket = planTier ?? NO_PLAN_LABEL
    planCounts.set(bucket, (planCounts.get(bucket) ?? 0) + 1)

    return {
      id: user.id,
      email: user.email ?? "—",
      name: displayName(user.metadata),
      orgName: org?.name ?? null,
      role: membership?.role ?? null,
      planTier,
      createdAt: user.created_at,
    }
  })

  const planBreakdown = [...planCounts.entries()]
    .map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => b.count - a.count)

  const recentSignups = [...rows]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 12)

  return {
    totalUsers: authUsers.length,
    organizations: orgById.size,
    newThisMonth,
    newLastMonth,
    newThisWeek,
    planBreakdown,
    recentSignups,
  }
}
