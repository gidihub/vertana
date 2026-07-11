"use client"

import { useMemo, useState } from "react"

import {
  funnelForTest,
  pickDefaultTestId,
} from "@/lib/dashboard/stats"
import { useStore } from "@/lib/store"
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

  const defaultId = useMemo(() => pickDefaultTestId(tests), [tests])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? defaultId

  const testCandidates = useMemo(
    () => (activeId ? candidates.filter((c) => c.test_id === activeId) : []),
    [activeId, candidates],
  )

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

  if (loading || tests.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-ink">Assessment analytics</h2>
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
      </div>

      {selectedTest ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ResultsFunnel
            stats={funnel}
            description="Email invites sent → started → completed → recruiter disposition for this assessment."
            usesShareLink={selectedTest.status === "active"}
          />
          <ScoreDistributionChart candidates={testCandidates} compact />
        </div>
      ) : null}
    </div>
  )
}
