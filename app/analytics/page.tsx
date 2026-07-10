"use client"

import {
  orgCompletionRate,
  totalNeedsScoring,
} from "@/lib/dashboard/stats"
import {
  hasIntegrityConcern,
  resolveIntegrityThreshold,
} from "@/lib/integrity"
import { warningSurface, numericText } from "@/lib/design-tokens"
import { useStore, useNeedsScoring } from "@/lib/store"
import { OrgAnalyticsCharts } from "@/components/analytics/org-analytics-charts"
import { RecruiterShell } from "@/components/recruiter-shell"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function KpiCard({
  label,
  value,
  warning = false,
}: {
  label: string
  value: string | number
  warning?: boolean
}) {
  return (
    <Card className={warning ? cn("border", warningSurface) : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn("text-3xl", numericText)}>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export default function AnalyticsPage() {
  const tests = useStore((db) => db.tests)
  const candidates = useStore((db) => db.candidates)
  const needsScoring = useNeedsScoring()
  const loading = useStore((db) => db.loading)
  const tabSwitchThreshold = useStore(
    (db) => db.organization?.tab_switch_threshold,
  )
  const orgThreshold = resolveIntegrityThreshold(tabSwitchThreshold)

  const completionRate = orgCompletionRate(candidates)
  const needsTotal = totalNeedsScoring(needsScoring)
  const submitted = candidates.filter((c) => c.status === "submitted").length
  const inProgress = candidates.filter((c) => c.status === "in_progress").length
  const integrityFlags = candidates.filter((c) =>
    hasIntegrityConcern(c.tab_switch_count, orgThreshold),
  ).length

  return (
    <RecruiterShell
      title="Analytics"
      subtitle="Organization-wide hiring assessment metrics."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Active assessments"
              value={tests.filter((t) => t.status === "active").length}
            />
            <KpiCard label="Total candidates" value={candidates.length} />
            <KpiCard label="Completion rate" value={`${completionRate}%`} />
            <KpiCard label="Needs scoring" value={needsTotal} warning />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className={cn("text-2xl", numericText)}>
                  {submitted}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Submitted attempts across all tests.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>In progress</CardDescription>
                <CardTitle className={cn("text-2xl", numericText)}>
                  {inProgress}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Candidates currently taking an assessment.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Integrity flags</CardDescription>
                <CardTitle className={cn("text-2xl", numericText)}>
                  {integrityFlags}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Candidates at or above your tab-switch threshold (
                {orgThreshold}).
              </CardContent>
            </Card>
          </div>

          <OrgAnalyticsCharts />
        </div>
      )}
    </RecruiterShell>
  )
}
