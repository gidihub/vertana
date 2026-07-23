"use client"

import { useEffect, useState } from "react"
import { Building2, Loader2, TrendingUp, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"

import { KpiCard } from "@/components/analytics/kpi-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CmsUserAnalytics, CmsUserRow } from "@/lib/cms/users"
import { computeDelta } from "@/lib/dashboard/filters"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

function planLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

const ROLE_STYLES: Record<string, string> = {
  owner: "border-amber-200 bg-amber-50 text-amber-900",
  admin: "border-sky-200 bg-sky-50 text-sky-900",
  member: "border-sage-line bg-sage text-ink",
}

function initials(row: CmsUserRow): string {
  const base = row.name ?? row.email
  const parts = base.split(/[\s@._-]+/).filter(Boolean)
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
  return (letters || base.slice(0, 2)).toUpperCase()
}

export function UsersDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CmsUserAnalytics | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      try {
        const res = await fetch("/api/cms/users", { signal: controller.signal })
        const body = (await res.json()) as CmsUserAnalytics & { error?: string }
        if (!res.ok) throw new Error(body.error ?? "Failed to load users")
        setData(body)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        toast.error((err as Error).message)
        setData(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [])

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" />
        Loading users…
      </div>
    )
  }

  if (!data) {
    return (
      <p className="py-10 text-sm text-ink-muted">
        Could not load users. Check your connection and try again.
      </p>
    )
  }

  const monthDelta = computeDelta(data.newThisMonth, data.newLastMonth, true)
  const maxPlan = Math.max(1, ...data.planBreakdown.map((p) => p.count))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total users"
          value={data.totalUsers}
          icon={Users}
          caption="All time"
        />
        <KpiCard
          label="Organizations"
          value={data.organizations}
          icon={Building2}
          caption="Active accounts"
        />
        <KpiCard
          label="New this month"
          value={data.newThisMonth}
          icon={TrendingUp}
          delta={monthDelta}
          comparisonLabel="vs last month"
          caption="This calendar month"
        />
        <KpiCard
          label="New this week"
          value={data.newThisWeek}
          icon={UserPlus}
          caption="Last 7 days"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by plan</CardTitle>
            <CardDescription>Plan tier of each user&apos;s org</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.planBreakdown.length === 0 ? (
              <p className="text-sm text-ink-muted">No users yet.</p>
            ) : (
              data.planBreakdown.map((p) => {
                const pct =
                  data.totalUsers > 0
                    ? Math.round((p.count / data.totalUsers) * 100)
                    : 0
                return (
                  <div key={p.tier} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-ink">
                        {planLabel(p.tier)}
                      </span>
                      <span className="text-ink-muted">
                        {p.count}{" "}
                        <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage">
                      <div
                        className="h-full rounded-full bg-pine"
                        style={{ width: `${(p.count / maxPlan) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent signups</CardTitle>
            <CardDescription>Latest users to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentSignups.length === 0 ? (
              <p className="text-sm text-ink-muted">No signups yet.</p>
            ) : (
              data.recentSignups.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-paper/70"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pine/10 text-xs font-semibold text-pine">
                    {initials(user)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {user.name ?? user.email}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {user.name ? user.email : (user.orgName ?? "No org")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-sage-line bg-sage px-2 py-0.5 text-xs font-medium capitalize">
                      {user.planTier ? planLabel(user.planTier) : "Free"}
                    </span>
                    {user.role ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                          ROLE_STYLES[user.role] ??
                            "border-sage-line bg-sage text-ink",
                        )}
                      >
                        {user.role}
                      </span>
                    ) : null}
                    <span className="w-14 text-right text-xs text-ink-muted">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
