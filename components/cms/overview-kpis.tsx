"use client"

import { Building2, FileText, MessageSquare, Users } from "lucide-react"

import { KpiCard } from "@/components/analytics/kpi-card"
import type { CmsOverviewStats } from "@/lib/cms/overview"

export function OverviewKpis({ stats }: { stats: CmsOverviewStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total Users"
        value={stats.totalUsers}
        icon={Users}
        caption={
          stats.newUsersThisMonth > 0
            ? `+${stats.newUsersThisMonth} this month`
            : "All time"
        }
      />
      <KpiCard
        label="Organizations"
        value={stats.organizations}
        icon={Building2}
        caption="Active accounts"
      />
      <KpiCard
        label="Blog Posts"
        value={stats.blogPublished}
        icon={FileText}
        caption={`${stats.blogDrafts} draft${stats.blogDrafts === 1 ? "" : "s"}`}
      />
      <KpiCard
        label="New Feedback"
        value={stats.feedbackNew}
        icon={MessageSquare}
        caption="Unreviewed"
      />
    </div>
  )
}
