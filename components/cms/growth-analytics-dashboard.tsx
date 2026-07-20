"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Building2,
  CreditCard,
  FileText,
  Loader2,
  MessageSquare,
  Users,
  ListChecks,
  PlayCircle,
  CircleCheckBig,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { DateRangeSelect } from "@/components/analytics/date-range-select"
import { KpiCard } from "@/components/analytics/kpi-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CmsGrowthAnalytics } from "@/lib/cms/analytics"
import {
  computeDelta,
  DEFAULT_RANGE,
  type RangeKey,
} from "@/lib/dashboard/filters"
import { formatDateTime } from "@/lib/format"

const signupChartConfig = {
  count: { label: "New orgs", color: "var(--chart-1)" },
} satisfies ChartConfig

const planChartConfig = {
  count: { label: "Organizations", color: "var(--chart-2)" },
} satisfies ChartConfig

function planLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export function GrowthAnalyticsDashboard() {
  const [range, setRange] = useState<RangeKey>(DEFAULT_RANGE)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CmsGrowthAnalytics | null>(null)

  const load = useCallback(async (selected: RangeKey, signal?: AbortSignal) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cms/analytics?range=${selected}`, { signal })
      const body = (await res.json()) as CmsGrowthAnalytics & { error?: string }
      if (!res.ok) throw new Error(body.error ?? "Failed to load analytics")
      setData(body)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      toast.error((err as Error).message)
      setData(null)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(range, controller.signal)
    return () => controller.abort()
  }, [range, load])

  const comparisonLabel = data?.comparisonLabel ?? "vs previous period"
  const hasComparison = data?.hasComparison ?? false

  const signupHasData = useMemo(
    () => data?.signupTrend.some((p) => p.count > 0) ?? false,
    [data?.signupTrend],
  )

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" />
        Loading analytics…
      </div>
    )
  }

  if (!data) {
    return (
      <p className="py-10 text-sm text-ink-muted">
        Could not load analytics. Check your connection and try again.
      </p>
    )
  }

  const { kpis } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Platform-wide signup and product usage metrics.
        </p>
        <DateRangeSelect value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Organizations"
          value={kpis.organizations.total}
          icon={Building2}
          delta={computeDelta(
            kpis.organizations.current,
            kpis.organizations.previous,
            hasComparison,
          )}
          comparisonLabel={comparisonLabel}
          caption={
            hasComparison
              ? `${kpis.organizations.current} new in period`
              : "All registered orgs"
          }
        />
        <KpiCard
          label="Paid plans"
          value={kpis.paidOrganizations.total}
          icon={CreditCard}
          caption="Orgs on paid or trialing plans"
        />
        <KpiCard
          label="Team members"
          value={kpis.teamMembers.total}
          icon={Users}
          delta={computeDelta(
            kpis.teamMembers.current,
            kpis.teamMembers.previous,
            hasComparison,
          )}
          comparisonLabel={comparisonLabel}
          caption={
            hasComparison
              ? `${kpis.teamMembers.current} joined in period`
              : "Recruiter seats across orgs"
          }
        />
        <KpiCard
          label="Assessments created"
          value={kpis.testsCreated.total}
          icon={ListChecks}
          delta={computeDelta(
            kpis.testsCreated.current,
            kpis.testsCreated.previous,
            hasComparison,
          )}
          comparisonLabel={comparisonLabel}
          caption={
            hasComparison
              ? `${kpis.testsCreated.current} new in period`
              : "Total tests on platform"
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Assessments started"
          value={kpis.assessmentsStarted.current}
          icon={PlayCircle}
          delta={computeDelta(
            kpis.assessmentsStarted.current,
            kpis.assessmentsStarted.previous,
            hasComparison,
          )}
          comparisonLabel={comparisonLabel}
        />
        <KpiCard
          label="Assessments completed"
          value={kpis.assessmentsCompleted.current}
          icon={CircleCheckBig}
          delta={computeDelta(
            kpis.assessmentsCompleted.current,
            kpis.assessmentsCompleted.previous,
            hasComparison,
          )}
          comparisonLabel={comparisonLabel}
        />
        <KpiCard
          label="Blog posts live"
          value={kpis.blogPublished}
          icon={FileText}
          caption={`${kpis.blogDrafts} draft${kpis.blogDrafts === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="New feedback"
          value={kpis.feedbackNew}
          icon={MessageSquare}
          caption={`${kpis.feedbackTotal} total submissions`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signup trend</CardTitle>
            <CardDescription>New organizations per day</CardDescription>
          </CardHeader>
          <CardContent>
            {signupHasData ? (
              <ChartContainer config={signupChartConfig} className="aspect-[16/7] w-full">
                <BarChart data={data.signupTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex aspect-[16/7] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                No new signups in this period.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan mix</CardTitle>
            <CardDescription>Organizations by plan tier</CardDescription>
          </CardHeader>
          <CardContent>
            {data.planBreakdown.length > 0 ? (
              <ChartContainer config={planChartConfig} className="aspect-[16/7] w-full">
                <BarChart
                  data={data.planBreakdown.map((p) => ({
                    ...p,
                    tier: planLabel(p.tier),
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="tier"
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex aspect-[16/7] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                No organizations yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent signups</CardTitle>
            <CardDescription>Latest organizations created</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-sage-line bg-sage px-2 py-0.5 text-xs font-medium capitalize">
                        {org.plan_tier}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-ink-muted">
                      {formatDateTime(org.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Recent feedback</CardTitle>
              <CardDescription>Latest site submissions</CardDescription>
            </div>
            <Link
              href="/cms/feedback"
              className="text-xs font-medium text-pine hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentFeedback.length === 0 ? (
              <p className="text-sm text-ink-muted">No feedback yet.</p>
            ) : (
              data.recentFeedback.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-sage-line/70 bg-paper/50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium capitalize text-ink-muted">
                      {item.status}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink">{item.message}</p>
                  {item.email ? (
                    <p className="mt-1 text-xs text-ink-muted">{item.email}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-ink-muted">
        For per-organization hiring metrics, use the{" "}
        <Link href="/analytics" className="font-medium text-pine hover:underline">
          recruiter analytics
        </Link>{" "}
        dashboard inside the product.
      </p>
    </div>
  )
}
