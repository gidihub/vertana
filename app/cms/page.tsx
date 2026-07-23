import Link from "next/link"
import { Megaphone, MessageSquare, PenLine, TrendingUp } from "lucide-react"

import { OverviewKpis } from "@/components/cms/overview-kpis"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCmsOverviewStats, type CmsOverviewStats } from "@/lib/cms/overview"
import { cn } from "@/lib/utils"

const QUICK_ACTIONS = [
  { href: "/cms/blog/new", label: "Write a new blog post", icon: PenLine },
  { href: "/cms/announcements", label: "Manage announcements", icon: Megaphone },
  { href: "/cms/feedback", label: "View feedback inbox", icon: MessageSquare },
  { href: "/cms/users", label: "See user breakdown", icon: TrendingUp },
] as const

const EMPTY_STATS: CmsOverviewStats = {
  totalUsers: 0,
  newUsersThisMonth: 0,
  organizations: 0,
  blogPublished: 0,
  blogDrafts: 0,
  feedbackNew: 0,
}

export default async function CmsOverviewPage() {
  let stats = EMPTY_STATS
  let failed = false
  try {
    stats = await getCmsOverviewStats()
  } catch {
    failed = true
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-semibold tracking-tight">
          CMS Overview
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Manage Vertana&apos;s content and monitor growth.
        </p>
      </div>

      {failed ? (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Couldn&apos;t load live stats. Showing zeros — check the database
          connection.
        </p>
      ) : null}

      <OverviewKpis stats={stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg border border-sage-line/70 bg-paper/50 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-pine/30 hover:bg-sage"
              >
                <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />
                {label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <StatusRow
              label="Published posts"
              value={stats.blogPublished}
              tone="success"
            />
            <StatusRow label="Draft posts" value={stats.blogDrafts} />
            <StatusRow label="Unread feedback" value={stats.feedbackNew} />
            <StatusRow
              label="New users this month"
              value={stats.newUsersThisMonth}
              tone="info"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatusRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number
  tone?: "neutral" | "success" | "info"
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span
        className={cn(
          "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
          tone === "success" && value > 0
            ? "bg-emerald-100 text-emerald-800"
            : tone === "info" && value > 0
              ? "bg-sky-100 text-sky-800"
              : "bg-sage text-ink-muted",
        )}
      >
        {value}
      </span>
    </div>
  )
}
