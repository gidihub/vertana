import type { Candidate } from "@/lib/types"

/**
 * Client-side time-range filtering + period-over-period comparison for the
 * analytics surfaces. Everything here is derived from data already loaded into
 * the store (candidate `started_at` / `submitted_at`), so no extra queries are
 * needed. Candidates that have never started (no activity timestamp) fall
 * outside every bounded window — they only surface under "All time".
 */

export type RangeKey =
  | "all"
  | "today"
  | "yesterday"
  | "7d"
  | "15d"
  | "30d"
  | "90d"
  | "180d"

export interface RangeOption {
  key: RangeKey
  label: string
}

export const RANGE_OPTIONS: RangeOption[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "15d", label: "Last 15 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 3 months" },
  { key: "180d", label: "Last 6 months" },
]

/** Default keeps the view scoped/relevant while still showing period deltas. */
export const DEFAULT_RANGE: RangeKey = "30d"

/**
 * Human label for the period-over-period comparison shown on KPI deltas.
 * Calendar-day ranges get explicit phrasing; rolling ranges derive from the
 * range label (e.g. "Last 30 days" → "vs previous 30 days").
 */
export function comparisonLabelForRange(key: RangeKey): string {
  if (key === "today") return "vs same period yesterday"
  if (key === "yesterday") return "vs day before"
  const label = RANGE_OPTIONS.find((o) => o.key === key)?.label ?? "All time"
  return `vs previous ${label.replace(/^Last /, "").toLowerCase()}`
}

/** Half-open window [start, end) in epoch ms. */
export interface DateWindow {
  start: number
  end: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Local midnight `offset` calendar days from `ms`. Uses `setDate` so day
 * boundaries follow the local calendar and stay correct across DST transitions
 * (a fixed `DAY_MS` subtraction would drift by an hour on the switch day).
 */
function calendarDayStart(ms: number, offset = 0): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.getTime()
}

function startOfDay(ms: number): number {
  return calendarDayStart(ms, 0)
}

/**
 * The current window for a range and the immediately-preceding equal-length
 * window used for period-over-period deltas. `current: null` means "all time"
 * (no filtering, no comparison).
 */
export function windowsForRange(
  key: RangeKey,
  now: number = Date.now(),
): { current: DateWindow | null; previous: DateWindow | null } {
  if (key === "all") return { current: null, previous: null }

  if (key === "today") {
    // Compare the portion of today elapsed so far against the equivalent
    // portion of yesterday (equal-length windows keep the delta fair).
    const todayStart = calendarDayStart(now, 0)
    const prevStart = calendarDayStart(now, -1)
    const elapsed = now - todayStart
    return {
      current: { start: todayStart, end: now },
      previous: { start: prevStart, end: prevStart + elapsed },
    }
  }

  if (key === "yesterday") {
    const todayStart = calendarDayStart(now, 0)
    const yesterdayStart = calendarDayStart(now, -1)
    const dayBeforeStart = calendarDayStart(now, -2)
    return {
      current: { start: yesterdayStart, end: todayStart },
      previous: { start: dayBeforeStart, end: yesterdayStart },
    }
  }

  const days: Record<Exclude<RangeKey, "all" | "today" | "yesterday">, number> = {
    "7d": 7,
    "15d": 15,
    "30d": 30,
    "90d": 90,
    "180d": 180,
  }
  const span = days[key] * DAY_MS
  return {
    current: { start: now - span, end: now },
    previous: { start: now - 2 * span, end: now - span },
  }
}

/** The timestamp used to place a candidate on the timeline (submit, else start). */
export function candidateActivityMs(c: Candidate): number | null {
  const iso = c.submitted_at ?? c.started_at
  if (!iso) return null
  const ms = new Date(iso).getTime()
  return Number.isFinite(ms) ? ms : null
}

function inWindow(ms: number | null, w: DateWindow): boolean {
  return ms !== null && ms >= w.start && ms < w.end
}

/** Candidates whose activity falls in the window (all candidates when null). */
export function filterByWindow(
  candidates: Candidate[],
  window: DateWindow | null,
): Candidate[] {
  if (!window) return candidates
  return candidates.filter((c) => inWindow(candidateActivityMs(c), window))
}

export interface RangeSlices {
  current: Candidate[]
  previous: Candidate[]
  window: DateWindow | null
}

/** Split candidates into the current and previous comparison windows. */
export function sliceCandidatesByRange(
  candidates: Candidate[],
  key: RangeKey,
  now: number = Date.now(),
): RangeSlices {
  const { current, previous } = windowsForRange(key, now)
  return {
    current: filterByWindow(candidates, current),
    previous: previous ? filterByWindow(candidates, previous) : [],
    window: current,
  }
}

export interface Delta {
  /** Absolute percentage change, one decimal. */
  pct: number
  direction: "up" | "down" | "flat"
}

/**
 * Period-over-period delta. Returns null when there's no meaningful comparison
 * (all-time view, or no prior activity to compare against).
 */
export function computeDelta(
  current: number,
  previous: number,
  hasComparison: boolean,
): Delta | null {
  if (!hasComparison) return null
  if (previous === 0) {
    if (current === 0) return null
    return { pct: 100, direction: "up" }
  }
  const raw = ((current - previous) / previous) * 100
  const pct = Math.round(Math.abs(raw) * 10) / 10
  return { pct, direction: raw > 0 ? "up" : raw < 0 ? "down" : "flat" }
}

export interface TrendPoint {
  /** Bucket start (epoch ms), for sorting/keys. */
  ms: number
  /** Short axis label, e.g. "Jul 3". */
  label: string
  started: number
  completed: number
}

/**
 * Daily (or weekly for long spans) counts of started vs completed assessments
 * within a window. When no window is given, spans from the earliest activity to
 * now. `started` buckets on `started_at`, `completed` on `submitted_at`.
 */
export function buildActivityTrend(
  candidates: Candidate[],
  window: DateWindow | null,
  now: number = Date.now(),
): { points: TrendPoint[]; bucket: "day" | "week" } {
  // For the all-time lower bound, consider both event timestamps per candidate:
  // `candidateActivityMs` prefers `submitted_at`, but a candidate's `started_at`
  // can be earlier, so the earliest bucket must reach back to it.
  const times: number[] = []
  for (const c of candidates) {
    if (c.started_at) {
      const ms = new Date(c.started_at).getTime()
      if (Number.isFinite(ms)) times.push(ms)
    }
    if (c.submitted_at) {
      const ms = new Date(c.submitted_at).getTime()
      if (Number.isFinite(ms)) times.push(ms)
    }
  }

  let start: number
  let end: number
  if (window) {
    start = window.start
    end = window.end
  } else if (times.length > 0) {
    start = Math.min(...times)
    end = now
  } else {
    return { points: [], bucket: "day" }
  }

  const spanDays = Math.max(1, Math.ceil((end - start) / DAY_MS))
  const bucket: "day" | "week" = spanDays > 45 ? "week" : "day"
  const stepDays = bucket === "week" ? 7 : 1

  const gridStart = startOfDay(start)
  const buckets = new Map<number, TrendPoint>()
  // Step by calendar days (via `calendarDayStart`) so bucket boundaries stay on
  // local midnight across DST transitions; a fixed `bucketMs` stride would drift
  // by an hour on the switch day and misalign the grid.
  // `t < end` (not `<=`) keeps the window half-open: a bucket whose start lands
  // exactly on `end` (e.g. today's midnight for the "yesterday" range) is not
  // created.
  for (let offset = 0; ; offset += stepDays) {
    const t = calendarDayStart(gridStart, offset)
    if (t >= end) break
    buckets.set(t, {
      ms: t,
      label: new Date(t).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      started: 0,
      completed: 0,
    })
  }

  const keyFor = (ms: number): number => {
    // Calendar-day ordinal from the grid origin (rounded to absorb the ±1h DST
    // skew between two local midnights), snapped to the bucket's day stride.
    const dayOrdinal = Math.round((startOfDay(ms) - gridStart) / DAY_MS)
    const bucketOffset = Math.floor(dayOrdinal / stepDays) * stepDays
    return calendarDayStart(gridStart, bucketOffset)
  }

  // Attribute each event by its own timestamp, honoring the exact half-open
  // window [start, end): events before `start` or at/after `end` are excluded.
  for (const c of candidates) {
    if (c.started_at) {
      const ms = new Date(c.started_at).getTime()
      if (Number.isFinite(ms) && ms >= start && ms < end) {
        const b = buckets.get(keyFor(ms))
        if (b) b.started++
      }
    }
    if (c.submitted_at) {
      const ms = new Date(c.submitted_at).getTime()
      if (Number.isFinite(ms) && ms >= start && ms < end) {
        const b = buckets.get(keyFor(ms))
        if (b) b.completed++
      }
    }
  }

  return {
    points: [...buckets.values()].sort((a, b) => a.ms - b.ms),
    bucket,
  }
}
