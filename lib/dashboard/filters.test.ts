import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { Candidate } from "@/lib/types"
import {
  buildActivityTrend,
  comparisonLabelForRange,
  computeDelta,
  sliceCandidatesByRange,
  windowsForRange,
} from "./filters.ts"

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date("2026-07-17T12:00:00.000Z").getTime()

function candidate(partial: Partial<Candidate>): Candidate {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    test_id: partial.test_id ?? "t1",
    email: partial.email ?? "a@b.com",
    status: partial.status ?? "submitted",
    score: partial.score ?? null,
    tab_switch_count: partial.tab_switch_count ?? 0,
    flagged: partial.flagged ?? false,
    consent_id: null,
    started_at: partial.started_at ?? null,
    submitted_at: partial.submitted_at ?? null,
    disposition: partial.disposition ?? "under_review",
  }
}

describe("windowsForRange", () => {
  it("returns null current window for all-time", () => {
    const { current, previous } = windowsForRange("all", NOW)
    assert.equal(current, null)
    assert.equal(previous, null)
  })

  it("builds equal-length current and previous windows", () => {
    const { current, previous } = windowsForRange("7d", NOW)
    assert.ok(current && previous)
    assert.equal(current.end, NOW)
    assert.equal(current.start, NOW - 7 * DAY)
    assert.equal(previous.end, current.start)
    assert.equal(previous.start, NOW - 14 * DAY)
  })

  it("compares today against the equivalent elapsed portion of yesterday", () => {
    const { current, previous } = windowsForRange("today", NOW)
    assert.ok(current && previous)
    assert.equal(current.end, NOW)
    // Equal-length windows so the delta is a fair comparison.
    assert.equal(current.end - current.start, previous.end - previous.start)
    // Previous window is anchored to yesterday's start.
    assert.equal(current.start - previous.start, DAY)
  })

  it("aligns yesterday and its previous window to full calendar days", () => {
    const { current, previous } = windowsForRange("yesterday", NOW)
    assert.ok(current && previous)
    // Contiguous, back-to-back day windows.
    assert.equal(previous.end, current.start)
    assert.equal(current.end - current.start, DAY)
    assert.equal(previous.end - previous.start, DAY)
  })
})

describe("comparisonLabelForRange", () => {
  it("uses explicit phrasing for calendar-day ranges", () => {
    assert.equal(comparisonLabelForRange("today"), "vs same period yesterday")
    assert.equal(comparisonLabelForRange("yesterday"), "vs day before")
  })

  it("derives rolling-range labels from the range label", () => {
    assert.equal(comparisonLabelForRange("30d"), "vs previous 30 days")
    assert.equal(comparisonLabelForRange("90d"), "vs previous 3 months")
  })
})

describe("buildActivityTrend half-open window", () => {
  it("excludes events at the exclusive end boundary", () => {
    const { current } = windowsForRange("yesterday", NOW)
    assert.ok(current)
    // A submission exactly at `end` (today's midnight) must not be counted, and
    // no bucket should be created at that boundary.
    const candidates = [
      candidate({ submitted_at: new Date(current.end).toISOString() }),
      candidate({ started_at: new Date(current.start + 60_000).toISOString() }),
    ]
    const { points } = buildActivityTrend(candidates, current)
    const completed = points.reduce((n, p) => n + p.completed, 0)
    const started = points.reduce((n, p) => n + p.started, 0)
    assert.equal(completed, 0)
    assert.equal(started, 1)
    assert.ok(points.every((p) => p.ms < current.end))
  })
})

describe("sliceCandidatesByRange", () => {
  const candidates = [
    candidate({ id: "recent", submitted_at: new Date(NOW - 2 * DAY).toISOString() }),
    candidate({ id: "prior", submitted_at: new Date(NOW - 9 * DAY).toISOString() }),
    candidate({ id: "old", submitted_at: new Date(NOW - 40 * DAY).toISOString() }),
    candidate({ id: "never", submitted_at: null, started_at: null }),
  ]

  it("splits into current and previous windows by activity date", () => {
    const { current, previous } = sliceCandidatesByRange(candidates, "7d", NOW)
    assert.deepEqual(current.map((c) => c.id), ["recent"])
    assert.deepEqual(previous.map((c) => c.id), ["prior"])
  })

  it("keeps every candidate for all-time and has no previous window", () => {
    const { current, previous } = sliceCandidatesByRange(candidates, "all", NOW)
    assert.equal(current.length, 4)
    assert.equal(previous.length, 0)
  })
})

describe("computeDelta", () => {
  it("returns null when comparison is disabled", () => {
    assert.equal(computeDelta(5, 2, false), null)
  })

  it("computes an upward percentage change", () => {
    assert.deepEqual(computeDelta(12, 8, true), { pct: 50, direction: "up" })
  })

  it("computes a downward percentage change", () => {
    assert.deepEqual(computeDelta(4, 8, true), { pct: 50, direction: "down" })
  })

  it("treats growth from zero as +100% up", () => {
    assert.deepEqual(computeDelta(3, 0, true), { pct: 100, direction: "up" })
  })
})

describe("buildActivityTrend", () => {
  it("buckets started and completed counts per day", () => {
    const { current, previous: _p } = windowsForRange("7d", NOW)
    const candidates = [
      candidate({
        started_at: new Date(NOW - 2 * DAY).toISOString(),
        submitted_at: new Date(NOW - 2 * DAY).toISOString(),
      }),
      candidate({ started_at: new Date(NOW - 2 * DAY).toISOString() }),
    ]
    const { points, bucket } = buildActivityTrend(candidates, current)
    assert.equal(bucket, "day")
    const total = points.reduce(
      (acc, p) => ({ started: acc.started + p.started, completed: acc.completed + p.completed }),
      { started: 0, completed: 0 },
    )
    assert.equal(total.started, 2)
    assert.equal(total.completed, 1)
  })
})
