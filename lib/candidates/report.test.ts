import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  answerBucket,
  attemptFlags,
  completedUnusuallyFast,
  gradeFromScore,
  mcqAnswerRows,
  mediaAvailability,
  scoreBreakdown,
} from "./report.ts"

const answer = (over: Partial<Parameters<typeof answerBucket>[0]> = {}) => ({
  response: "x",
  is_correct: null as boolean | null,
  points_awarded: null as number | null,
  max_points: 1,
  ...over,
})

describe("answerBucket", () => {
  it("buckets a blank response as not attempted", () => {
    assert.equal(answerBucket(answer({ response: "  " })), "not_attempted")
  })

  it("treats empty coding JSON as not attempted", () => {
    assert.equal(
      answerBucket(answer({ response: '{"language":"js","code":"  "}' })),
      "not_attempted",
    )
  })

  it("buckets correct/incorrect from is_correct", () => {
    assert.equal(answerBucket(answer({ is_correct: true })), "correct")
    assert.equal(answerBucket(answer({ is_correct: false })), "incorrect")
  })

  it("buckets ungraded free-text as needs review", () => {
    assert.equal(answerBucket(answer({ is_correct: null })), "needs_review")
  })

  it("buckets partial credit", () => {
    assert.equal(
      answerBucket(answer({ is_correct: null, points_awarded: 1, max_points: 3 })),
      "partial",
    )
  })
})

describe("scoreBreakdown", () => {
  it("only returns buckets that occur, in canonical order", () => {
    const rows = scoreBreakdown([
      answer({ is_correct: true, max_points: 1, points_awarded: 1 }),
      answer({ is_correct: false }),
      answer({ is_correct: false }),
      answer({ response: "" }),
    ])
    assert.deepEqual(rows, [
      { bucket: "correct", count: 1 },
      { bucket: "incorrect", count: 2 },
      { bucket: "not_attempted", count: 1 },
    ])
  })
})

describe("completedUnusuallyFast", () => {
  it("fires below 25% of expected time", () => {
    assert.equal(
      completedUnusuallyFast({
        startedAt: "2026-01-01T00:00:00Z",
        submittedAt: "2026-01-01T00:02:00Z", // 2 min of a 60 min test
        expectedMinutes: 60,
      }),
      true,
    )
  })

  it("does not fire for a normal duration", () => {
    assert.equal(
      completedUnusuallyFast({
        startedAt: "2026-01-01T00:00:00Z",
        submittedAt: "2026-01-01T00:40:00Z",
        expectedMinutes: 60,
      }),
      false,
    )
  })
})

describe("attemptFlags", () => {
  it("includes fast completion and tab-switch flags", () => {
    const flags = attemptFlags({
      startedAt: "2026-01-01T00:00:00Z",
      submittedAt: "2026-01-01T00:02:00Z",
      expectedMinutes: 60,
      tabSwitchCount: 4,
      tabSwitchThreshold: 3,
    })
    assert.deepEqual(
      flags.map((f) => f.id),
      ["fast_completion", "tab_switches"],
    )
  })
})

describe("mcqAnswerRows", () => {
  it("marks the correct option and the candidate's wrong pick", () => {
    const rows = mcqAnswerRows(["A", "B", "C"], 0, "2")
    assert.equal(rows[0].correct, true)
    assert.equal(rows[0].selected, false)
    assert.equal(rows[2].selected, true)
    assert.equal(rows[2].correct, false)
    // The correct answer is always surfaced even on a wrong attempt.
    assert.ok(rows.some((r) => r.correct))
  })
})

describe("gradeFromScore", () => {
  it("maps full/zero/partial scores to grade fields", () => {
    assert.deepEqual(gradeFromScore(3, 3), { isCorrect: true, pointsAwarded: 3 })
    assert.deepEqual(gradeFromScore(0, 3), { isCorrect: false, pointsAwarded: 0 })
    assert.deepEqual(gradeFromScore(2, 3), { isCorrect: null, pointsAwarded: 2 })
  })

  it("clamps out-of-range scores", () => {
    assert.deepEqual(gradeFromScore(9, 3), { isCorrect: true, pointsAwarded: 3 })
    assert.deepEqual(gradeFromScore(-1, 3), { isCorrect: false, pointsAwarded: 0 })
  })
})

describe("mediaAvailability", () => {
  it("is available when media is present", () => {
    assert.equal(
      mediaAvailability({
        requiresProctoring: true,
        hasMedia: true,
        everCaptured: true,
      }),
      "available",
    )
  })

  it("is purged when media was captured but is gone", () => {
    assert.equal(
      mediaAvailability({
        requiresProctoring: true,
        hasMedia: false,
        everCaptured: true,
      }),
      "purged",
    )
  })

  it("is none when no media was ever captured", () => {
    assert.equal(
      mediaAvailability({
        requiresProctoring: true,
        hasMedia: false,
        everCaptured: false,
      }),
      "none",
    )
  })

  it("is none when proctoring wasn't required", () => {
    assert.equal(
      mediaAvailability({
        requiresProctoring: false,
        hasMedia: false,
        everCaptured: true,
      }),
      "none",
    )
  })
})
