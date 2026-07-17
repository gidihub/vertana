"use client"

import { useMemo, useState } from "react"
import {
  CheckCheck,
  CircleCheckBig,
  Clock,
  ListChecks,
  Pencil,
  ShieldAlert,
  Users,
} from "lucide-react"

import {
  orgCompletionRate,
  orgFunnel,
  totalNeedsScoring,
} from "@/lib/dashboard/stats"
import {
  computeDelta,
  comparisonLabelForRange,
  sliceCandidatesByRange,
  DEFAULT_RANGE,
  type RangeKey,
} from "@/lib/dashboard/filters"
import {
  hasIntegrityConcern,
  resolveIntegrityThreshold,
} from "@/lib/integrity"
import { useStore, useNeedsScoring } from "@/lib/store"
import type { Candidate } from "@/lib/types"
import { RecruiterShell } from "@/components/recruiter-shell"
import { DateRangeSelect } from "@/components/analytics/date-range-select"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ActivityTrendChart } from "@/components/analytics/activity-trend-chart"
import { RecentActivity } from "@/components/analytics/recent-activity"
import { ResultsFunnel } from "@/components/results/results-funnel"
import { ScoreDistributionChart } from "@/components/results/score-distribution-chart"

function countConcern(candidates: Candidate[], threshold: number): number {
  return candidates.filter((c) => hasIntegrityConcern(c.tab_switch_count, threshold))
    .length
}

export default function AnalyticsPage() {
  const tests = useStore((db) => db.tests)
  const candidates = useStore((db) => db.candidates)
  const emailFunnel = useStore((db) => db.emailFunnel)
  const needsScoring = useNeedsScoring()
  const loading = useStore((db) => db.loading)
  const tabSwitchThreshold = useStore(
    (db) => db.organization?.tab_switch_threshold,
  )
  const orgThreshold = resolveIntegrityThreshold(tabSwitchThreshold)

  const [range, setRange] = useState<RangeKey>(DEFAULT_RANGE)
  const comparisonLabel = comparisonLabelForRange(range)

  const { current, previous, window } = useMemo(
    () => sliceCandidatesByRange(candidates, range),
    [candidates, range],
  )
  const hasComparison = window !== null

  const testTitles = useMemo(
    () => Object.fromEntries(tests.map((t) => [t.id, t.title])),
    [tests],
  )

  const activeAssessments = tests.filter((t) => t.status === "active").length
  const completedCur = current.filter((c) => c.status === "submitted").length
  const completedPrev = previous.filter((c) => c.status === "submitted").length
  const inProgressCur = current.filter((c) => c.status === "in_progress").length
  const rateCur = orgCompletionRate(current)
  const ratePrev = orgCompletionRate(previous)
  const concernCur = countConcern(current, orgThreshold)
  const concernPrev = countConcern(previous, orgThreshold)
  const needsTotal = totalNeedsScoring(needsScoring)

  // Funnel stays lifetime — invite sends aren't timestamped, so range-scoping it
  // would misrepresent the top of the funnel.
  const lifetimeFunnel = useMemo(
    () =>
      orgFunnel(candidates, emailFunnel),
    [candidates, emailFunnel],
  )
  const hasActiveShareLink = tests.some((t) => t.status === "active")

  return (
    <RecruiterShell
      title="Analytics"
      subtitle="Organization-wide hiring assessment metrics."
      actions={<DateRangeSelect value={range} onChange={setRange} />}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Active assessments"
              value={activeAssessments}
              icon={ListChecks}
              caption="Currently accepting responses"
            />
            <KpiCard
              label="Candidates"
              value={current.length}
              icon={Users}
              delta={computeDelta(current.length, previous.length, hasComparison)}
              comparisonLabel={comparisonLabel}
              caption={hasComparison ? undefined : "All candidates"}
            />
            <KpiCard
              label="Completion rate"
              value={`${rateCur}%`}
              icon={CircleCheckBig}
              delta={computeDelta(rateCur, ratePrev, hasComparison)}
              comparisonLabel={comparisonLabel}
              caption={hasComparison ? undefined : "Submitted of all candidates"}
            />
            <KpiCard
              label="Needs scoring"
              value={needsTotal}
              icon={Pencil}
              warning
              caption="Awaiting manual review (all time)"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Completed"
              value={completedCur}
              icon={CheckCheck}
              delta={computeDelta(completedCur, completedPrev, hasComparison)}
              comparisonLabel={comparisonLabel}
              caption={hasComparison ? undefined : "Submitted attempts"}
            />
            <KpiCard
              label="In progress"
              value={inProgressCur}
              icon={Clock}
              caption="Currently taking an assessment (selected range)"
            />
            <KpiCard
              label="Integrity flags"
              value={concernCur}
              icon={ShieldAlert}
              delta={computeDelta(concernCur, concernPrev, hasComparison)}
              invertDelta
              comparisonLabel={comparisonLabel}
              caption={
                hasComparison
                  ? undefined
                  : `At or above tab-switch threshold (${orgThreshold})`
              }
            />
          </div>

          <ActivityTrendChart candidates={candidates} window={window} />

          <div className="grid gap-4 lg:grid-cols-2">
            <RecentActivity candidates={current} testTitles={testTitles} />
            <ScoreDistributionChart candidates={current} />
          </div>

          {tests.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-ink">
                Lifetime funnel
              </h2>
              <ResultsFunnel
                stats={lifetimeFunnel}
                description="Email invites sent → started → completed → recruiter disposition across all assessments (all time). Invited counts per-candidate email invites only (shared links excluded)."
                usesShareLink={hasActiveShareLink}
              />
            </div>
          ) : null}
        </div>
      )}
    </RecruiterShell>
  )
}
