import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { Question } from "../types.ts"
import { questionMinutes, suggestedTimeLimit } from "./time-estimate.ts"

const q = (
  type: Question["type"],
  estimated_minutes?: number | null,
): Pick<Question, "type" | "estimated_minutes"> => ({ type, estimated_minutes })

describe("questionMinutes", () => {
  it("uses the estimate when present", () => {
    assert.equal(questionMinutes(q("coding", 15)), 15)
  })

  it("falls back by type when estimate is missing", () => {
    assert.equal(questionMinutes(q("multiple_choice", null)), 2)
    assert.equal(questionMinutes(q("short_answer", undefined)), 5)
    assert.equal(questionMinutes(q("coding")), 12)
  })

  it("ignores non-positive estimates", () => {
    assert.equal(questionMinutes(q("coding", 0)), 12)
  })
})

describe("suggestedTimeLimit", () => {
  it("returns null with no questions", () => {
    assert.equal(suggestedTimeLimit([]), null)
  })

  it("sums estimates, adds buffer, rounds to nearest 5", () => {
    // raw = 10 + 10 = 20, +15% = 23, rounded to 25
    assert.equal(
      suggestedTimeLimit([q("short_answer", 10), q("short_answer", 10)]),
      25,
    )
  })

  it("clamps to a minimum of 15 minutes", () => {
    assert.equal(suggestedTimeLimit([q("multiple_choice", 2)]), 15)
  })

  it("clamps to a maximum of 240 minutes", () => {
    const many = Array.from({ length: 40 }, () => q("coding", 15))
    assert.equal(suggestedTimeLimit(many), 240)
  })
})
