import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { Question } from "../types.ts"
import {
  duplicateQuestionsError,
  filterNewQuestions,
  questionDuplicateKey,
} from "./duplicates.ts"

const question = (
  prompt: string,
  type: Question["type"] = "multiple_choice",
): Question => ({
  id: "q-1",
  test_id: "test-1",
  type,
  prompt,
  options: [],
  correct_option_index: null,
  position: 0,
})

describe("questionDuplicateKey", () => {
  it("normalizes whitespace in prompts", () => {
    assert.equal(
      questionDuplicateKey(question("  What is  React?  ")),
      questionDuplicateKey(question("What is React?")),
    )
  })

  it("ignores empty prompts", () => {
    assert.equal(questionDuplicateKey(question("   ")), null)
  })
})

describe("filterNewQuestions", () => {
  it("skips questions already on the test", () => {
    const existing = [question("What is React?")]
    const incoming = [
      question("What is React?"),
      question("Explain hooks", "short_answer"),
    ]

    const { accepted, skipped } = filterNewQuestions(existing, incoming)
    assert.equal(skipped, 1)
    assert.equal(accepted.length, 1)
    assert.equal(accepted[0]?.prompt, "Explain hooks")
  })
})

describe("duplicateQuestionsError", () => {
  it("detects duplicate prompts of the same type", () => {
    const err = duplicateQuestionsError([
      question("What is React?"),
      question("What is React?"),
    ])
    assert.match(err ?? "", /duplicate questions/i)
  })

  it("allows the same prompt across different types", () => {
    assert.equal(
      duplicateQuestionsError([
        question("What is React?"),
        question("What is React?", "short_answer"),
      ]),
      null,
    )
  })
})
