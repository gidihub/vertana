import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { toScoreDistribution } from "./score-distribution.ts"

describe("toScoreDistribution", () => {
  it("maps graded outcomes into score buckets", () => {
    const buckets = toScoreDistribution(
      [
        { label: "Correct", count: 6 },
        { label: "Incorrect", count: 3 },
        { label: "Ungraded", count: 1 },
      ],
      "multiple_choice",
      10,
    )

    assert.deepEqual(
      buckets.map((b) => b.count),
      [3, 1, 6],
    )
    assert.deepEqual(
      buckets.map((b) => b.pct),
      [30, 10, 60],
    )
    assert.deepEqual(
      buckets.map((b) => b.label),
      ["Incorrect", "Ungraded", "Correct"],
    )
  })

  it("maps coding pass rates into score buckets", () => {
    const buckets = toScoreDistribution(
      [
        { label: "0%", count: 2 },
        { label: "1–49%", count: 1 },
        { label: "50–99%", count: 3 },
        { label: "100%", count: 4 },
      ],
      "coding",
      10,
    )

    assert.deepEqual(
      buckets.map((b) => b.count),
      [2, 4, 4],
    )
    assert.deepEqual(
      buckets.map((b) => b.label),
      ["0%", "1–99%", "100%"],
    )
  })
})
