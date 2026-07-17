"use client"

import { useMemo, useState } from "react"
import { CircleCheckBig, ShieldAlert, Users } from "lucide-react"

import {
  funnelForTest,
  orgCompletionRate,
  pickDefaultTestId,
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
import { useStore } from "@/lib/store"
import { DateRangeSelect } from "@/components/analytics/date-range-select"
import { KpiCard } from "@/components/analytics/kpi-card"
import { ActivityTrendChart } from "@/components/analytics/activity-trend-chart"
import { RecentActivity } from "@/components/analytics/recent-activity"
import { ResultsFunnel } from "@/components/results/results-funnel"
import { ScoreDistributionChart } from "@/components/results/score-distribution-chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DashboardAnalytics() {
  const tests = useStore((db) => db.tests)
  const candidates = useStore((db) => db.candidates)
  const inviteCounts = useStore((db) => db.inviteCounts)
  const loading = useStore((db) => db.loading)
  const tabSwitchThreshold = useStore(
    (db) => db.organization?.tab_switch_threshold,
  )
  const orgThreshold = resolveIntegrityThreshold(tabSwitchThreshold)

  const defaultId = useMemo(() => pickDefaultTestId(tests), [tests])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [range, setRange] = useState<RangeKey>(DEFAULT_RANGE)
  const activeId = selectedId ?? defaultId
  const comparisonLabel = comparisonLabelForRange(range)

  const testCandidates = useMemo(
    () => (activeId ? candidates.filter((c) => c.test_id === activeId) : []),
    [activeId, candidates],
  )

  const { current, previous, window } = useMemo(
    () => sliceCandidatesByRange(testCandidates, range),
    [testCandidates, range],
  )
  const hasComparison = window !== null

  const funnel = useMemo(
    () =>
      activeId
        ? funnelForTest(testCandidates, inviteCounts[activeId] ?? 0)
        : {
            invited: 0,
            started: 0,
            completed: 0,
            shortlisted: 0,
            rejected: 0,
            hired: 0,
          },
    [activeId, inviteCounts, testCandidates],
  )
  const selectedTest = tests.find((t) => t.id === activeId)

  const testItems = useMemo(
    () => Object.fromEntries(tests.map((t) => [t.id, t.title])),
    [tests],
  )

  const completedCur = current.filter((c) => c.status === "submitted").length
  const rateCur = orgCompletionRate(current)
  const ratePrev = orgCompletionRate(previous)
  const concernCur = current.filter((c) =>
    hasIntegrityConcern(c.tab_switch_count, orgThreshold),
  ).length
  const concernPrev = previous.filter((c) =>
    hasIntegrityConcern(c.tab_switch_count, orgThreshold),
  ).length

  if (loading || tests.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-ink">Assessment analytics</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={activeId ?? ""}
            onValueChange={(v) => setSelectedId(v || null)}
            items={testItems}
          >
            <SelectTrigger className="h-9 w-full min-w-0 sm:w-72">
              <SelectValue placeholder="Select assessment" />
            </SelectTrigger>
            <SelectContent>
              {tests.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeSelect value={range} onChange={setRange} />
        </div>
      </div>

      {selectedTest ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Candidates"
              value={current.length}
              icon={Users}
              delta={computeDelta(current.length, previous.length, hasComparison)}
              comparisonLabel={comparisonLabel}
            />
            <KpiCard
              label="Completion rate"
              value={`${rateCur}%`}
              icon={CircleCheckBig}
              delta={computeDelta(rateCur, ratePrev, hasComparison)}
              comparisonLabel={comparisonLabel}
              caption={hasComparison ? undefined : `${completedCur} completed`}
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
                  : `Tab-switch threshold ${orgThreshold}`
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ResultsFunnel
              stats={funnel}
              description="Email invites sent → started → completed → recruiter disposition for this assessment (all time)."
              usesShareLink={selectedTest.status === "active"}
            />
            <ScoreDistributionChart candidates={current} compact />
          </div>

          <ActivityTrendChart
            candidates={testCandidates}
            window={window}
            compact
          />

          <RecentActivity
            candidates={current}
            testTitles={testItems}
            showAssessmentFilter={false}
          />
        </div>
      ) : null}
    </div>
  )
}
