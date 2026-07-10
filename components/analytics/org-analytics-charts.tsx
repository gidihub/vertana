"use client"

import { useMemo } from "react"
import Link from "next/link"
import { BarChart3 } from "lucide-react"

import { orgFunnel } from "@/lib/dashboard/stats"
import { useStore } from "@/lib/store"
import { ResultsFunnel } from "@/components/results/results-funnel"
import { ScoreDistributionChart } from "@/components/results/score-distribution-chart"
import { Button } from "@/components/ui/button"

export function OrgAnalyticsCharts() {
  const tests = useStore((db) => db.tests)
  const candidates = useStore((db) => db.candidates)
  const inviteCounts = useStore((db) => db.inviteCounts)

  const funnel = useMemo(
    () => orgFunnel(candidates, inviteCounts),
    [candidates, inviteCounts],
  )

  const hasActiveShareLink = tests.some((t) => t.status === "active")

  if (tests.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Create an assessment to see organization-wide funnel and score trends.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ResultsFunnel
          stats={funnel}
          description="Email invites sent → started → completed → recruiter disposition across all assessments. Invited counts per-candidate email invites only (shared links excluded)."
          usesShareLink={hasActiveShareLink}
        />
        <ScoreDistributionChart candidates={candidates} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <span>
          Per-assessment funnel and score breakdowns live on the dashboard and
          individual results pages.
        </span>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <BarChart3 data-icon="inline-start" />
          Per-test analytics
        </Button>
      </div>
    </div>
  )
}
