import {
  comparisonLabelForRange,
  windowsForRange,
  type RangeKey,
} from "@/lib/dashboard/filters"
import { createAdminClient } from "@/lib/supabase/admin"

export type CmsGrowthKpi = {
  total: number
  current: number
  previous: number
}

export type CmsGrowthAnalytics = {
  range: RangeKey
  comparisonLabel: string
  hasComparison: boolean
  kpis: {
    organizations: CmsGrowthKpi
    paidOrganizations: { total: number }
    teamMembers: CmsGrowthKpi
    testsCreated: CmsGrowthKpi
    assessmentsStarted: CmsGrowthKpi
    assessmentsCompleted: CmsGrowthKpi
    blogPublished: number
    blogDrafts: number
    feedbackNew: number
    feedbackTotal: number
  }
  signupTrend: Array<{ label: string; count: number }>
  planBreakdown: Array<{ tier: string; count: number }>
  recentOrganizations: Array<{
    id: string
    name: string
    plan_tier: string
    subscription_status: string | null
    created_at: string
  }>
  recentFeedback: Array<{
    id: string
    message: string
    email: string | null
    status: string
    created_at: string
  }>
}

function isoMs(ms: number): string {
  return new Date(ms).toISOString()
}

async function countAll(table: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
  if (error) throw error
  return count ?? 0
}

async function countBetween(
  table: string,
  column: string,
  start: string,
  end: string,
): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(column, start)
    .lt(column, end)
  if (error) throw error
  return count ?? 0
}

async function countBlog(status: "published" | "draft"): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", status)
    .is("deleted_at", null)
  if (error) throw error
  return count ?? 0
}

async function countFeedback(status?: "new"): Promise<number> {
  const admin = createAdminClient()
  let q = admin.from("cms_feedback").select("*", { count: "exact", head: true })
  if (status) q = q.eq("status", status)
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}

async function countAttemptsStartedAll(): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .not("started_at", "is", null)
  if (error) throw error
  return count ?? 0
}

async function countAttemptsCompletedAll(): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .not("submitted_at", "is", null)
  if (error) throw error
  return count ?? 0
}

const PLAN_TIERS = ["free", "starter", "growth", "custom"] as const

async function countPaidOrganizations(): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .or(
      "subscription_status.eq.active,subscription_status.eq.trialing,stripe_subscription_id.not.is.null,plan_tier.neq.free",
    )
  if (error) throw error
  return count ?? 0
}

async function countOrganizationsByPlanTier(tier: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .eq("plan_tier", tier)
  if (error) throw error
  return count ?? 0
}

async function fetchRecentOrganizations(): Promise<
  CmsGrowthAnalytics["recentOrganizations"]
> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organizations")
    .select("id, name, plan_tier, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(10)
  if (error) throw error
  return (data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    plan_tier: o.plan_tier,
    subscription_status: o.subscription_status,
    created_at: o.created_at,
  }))
}

async function fetchSignupTrendDates(
  startMs: number,
  endMs: number,
): Promise<string[]> {
  const admin = createAdminClient()
  const start = isoMs(startMs)
  const end = isoMs(endMs)
  const pageSize = 1000
  const dates: string[] = []
  let offset = 0

  while (true) {
    const { data, error } = await admin
      .from("organizations")
      .select("created_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    const rows = data ?? []
    dates.push(...rows.map((row) => row.created_at))
    if (rows.length < pageSize) break
    offset += pageSize
  }

  return dates
}

function bucketCounts(
  dates: string[],
  startMs: number,
  endMs: number,
): Array<{ label: string; count: number }> {
  const start = new Date(startMs)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endMs)
  end.setHours(0, 0, 0, 0)
  const dayCount =
    Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  const buckets = new Map<string, number>()

  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    buckets.set(key, 0)
  }

  for (const raw of dates) {
    const d = new Date(raw)
    d.setHours(0, 0, 0, 0)
    if (d.getTime() < start.getTime() || d.getTime() > end.getTime()) continue
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return [...buckets.entries()].map(([label, count]) => ({ label, count }))
}

export async function getCmsGrowthAnalytics(
  range: RangeKey,
): Promise<CmsGrowthAnalytics> {
  const admin = createAdminClient()
  const { current, previous } = windowsForRange(range)
  const hasComparison = current !== null && previous !== null

  const currentStart = current ? isoMs(current.start) : null
  const currentEnd = current ? isoMs(current.end) : isoMs(Date.now())
  const previousStart = previous ? isoMs(previous.start) : null
  const previousEnd = previous ? isoMs(previous.end) : null

  const trendStartMs = current?.start ?? Date.now() - 30 * 86400000
  const trendEndMs = current?.end ?? Date.now()

  const [
    orgTotal,
    orgCurrent,
    orgPrevious,
    memberTotal,
    memberCurrent,
    memberPrevious,
    testsTotal,
    testsCurrent,
    testsPrevious,
    startedTotal,
    startedCurrent,
    startedPrevious,
    completedTotal,
    completedCurrent,
    completedPrevious,
    blogPublished,
    blogDrafts,
    feedbackNew,
    feedbackTotal,
    paidTotal,
    planCounts,
    recentOrganizations,
    trendOrgDates,
    feedbackRows,
  ] = await Promise.all([
    countAll("organizations"),
    currentStart
      ? countBetween("organizations", "created_at", currentStart, currentEnd)
      : countAll("organizations"),
    previousStart && previousEnd
      ? countBetween("organizations", "created_at", previousStart, previousEnd)
      : Promise.resolve(0),
    countAll("team_members"),
    currentStart
      ? countBetween("team_members", "created_at", currentStart, currentEnd)
      : countAll("team_members"),
    previousStart && previousEnd
      ? countBetween("team_members", "created_at", previousStart, previousEnd)
      : Promise.resolve(0),
    countAll("tests"),
    currentStart
      ? countBetween("tests", "created_at", currentStart, currentEnd)
      : countAll("tests"),
    previousStart && previousEnd
      ? countBetween("tests", "created_at", previousStart, previousEnd)
      : Promise.resolve(0),
    countAttemptsStartedAll(),
    currentStart
      ? countBetween("attempts", "started_at", currentStart, currentEnd)
      : countAttemptsStartedAll(),
    previousStart && previousEnd
      ? countBetween("attempts", "started_at", previousStart, previousEnd)
      : Promise.resolve(0),
    countAttemptsCompletedAll(),
    currentStart
      ? countBetween("attempts", "submitted_at", currentStart, currentEnd)
      : countAttemptsCompletedAll(),
    previousStart && previousEnd
      ? countBetween("attempts", "submitted_at", previousStart, previousEnd)
      : Promise.resolve(0),
    countBlog("published"),
    countBlog("draft"),
    countFeedback("new"),
    countFeedback(),
    countPaidOrganizations(),
    Promise.all(PLAN_TIERS.map((tier) => countOrganizationsByPlanTier(tier))),
    fetchRecentOrganizations(),
    fetchSignupTrendDates(trendStartMs, trendEndMs),
    admin
      .from("cms_feedback")
      .select("id, message, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  if (feedbackRows.error) throw feedbackRows.error

  const planBreakdown = PLAN_TIERS.map((tier, index) => ({
    tier,
    count: planCounts[index],
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    range,
    comparisonLabel: comparisonLabelForRange(range),
    hasComparison,
    kpis: {
      organizations: {
        total: orgTotal,
        current: orgCurrent,
        previous: orgPrevious,
      },
      paidOrganizations: { total: paidTotal },
      teamMembers: {
        total: memberTotal,
        current: memberCurrent,
        previous: memberPrevious,
      },
      testsCreated: {
        total: testsTotal,
        current: testsCurrent,
        previous: testsPrevious,
      },
      assessmentsStarted: {
        total: startedTotal,
        current: startedCurrent,
        previous: startedPrevious,
      },
      assessmentsCompleted: {
        total: completedTotal,
        current: completedCurrent,
        previous: completedPrevious,
      },
      blogPublished,
      blogDrafts,
      feedbackNew,
      feedbackTotal,
    },
    signupTrend: bucketCounts(trendOrgDates, trendStartMs, trendEndMs),
    planBreakdown,
    recentOrganizations,
    recentFeedback: (feedbackRows.data ?? []).map((f) => ({
      id: f.id,
      message: f.message,
      email: f.email,
      status: f.status,
      created_at: f.created_at,
    })),
  }
}
