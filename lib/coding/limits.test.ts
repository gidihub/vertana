import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { Question } from "../types.ts"
import {
  MAX_CODING_TEST_CASES,
  codingAllowedForOrg,
  codingStatusForOrg,
  sanitizeQuestionsForPlan,
} from "./limits.ts"

const codingQuestion = (id: string, testCases = 1): Question => ({
  id,
  test_id: "test-1",
  type: "coding",
  prompt: "Write a function",
  options: [],
  correct_option_index: null,
  position: 0,
  test_cases: Array.from({ length: testCases }, (_, i) => ({
    input: String(i),
    expected_output: String(i),
  })),
})

describe("codingAllowedForOrg", () => {
  it("allows coding on every plan and region", () => {
    assert.equal(codingAllowedForOrg("free", "t5"), true)
    assert.equal(codingAllowedForOrg("starter", null), true)
    assert.equal(codingAllowedForOrg("growth", "t1"), true)
    assert.equal(codingAllowedForOrg("custom", "t5"), true)
  })
})

describe("codingStatusForOrg", () => {
  it("is always enabled with no upgrade CTA", () => {
    for (const tier of ["free", "starter", "growth", "custom"] as const) {
      const status = codingStatusForOrg(tier, "t5")
      assert.equal(status.allowed, true)
      assert.equal(status.showUpgrade, false)
    }
  })
})

describe("sanitizeQuestionsForPlan", () => {
  it("allows new coding questions on Free", () => {
    const result = sanitizeQuestionsForPlan(
      [codingQuestion("new-coding")],
      [],
      "free",
      "t5",
    )
    assert.equal(result[0]?.type, "coding")
  })

  it("clamps test cases to the maximum", () => {
    const result = sanitizeQuestionsForPlan(
      [codingQuestion("big", MAX_CODING_TEST_CASES + 3)],
      [],
      "growth",
      "t1",
    )
    assert.equal(result[0]?.test_cases?.length, MAX_CODING_TEST_CASES)
  })
})
