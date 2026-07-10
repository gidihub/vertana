import type { TestCase } from "@/lib/types"
import { parseCodingResponse } from "@/lib/coding/response"
import {
  formatCodingTestRunSummary,
  runCodingTestCases,
} from "@/lib/execution/run-coding-tests"

export interface CodingGradeResult {
  isCorrect: boolean | null
  pointsAwarded: number
  testCasesPassed: number
  testCasesTotal: number
  executionOutput: string
  executionStatus: string
}

export async function gradeCodingAnswer(input: {
  response: string
  testCases: TestCase[]
  maxPoints: number
  orgId?: string
}): Promise<CodingGradeResult> {
  const payload = parseCodingResponse(input.response)
  const total = input.testCases.length

  if (!payload?.code.trim()) {
    return {
      isCorrect: total > 0 ? false : null,
      pointsAwarded: 0,
      testCasesPassed: 0,
      testCasesTotal: total,
      executionOutput: "No code submitted.",
      executionStatus: "no_submission",
    }
  }

  if (total === 0) {
    return {
      isCorrect: null,
      pointsAwarded: 0,
      testCasesPassed: 0,
      testCasesTotal: 0,
      executionOutput: payload.code,
      executionStatus: "manual_review",
    }
  }

  const summary = await runCodingTestCases({
    code: payload.code,
    language: payload.language,
    testCases: input.testCases,
    orgId: input.orgId,
  })

  const ratio = total > 0 ? summary.passed / total : 0
  const pointsAwarded = Math.round(input.maxPoints * ratio * 100) / 100
  const isCorrect =
    summary.passed === total ? true : summary.passed === 0 ? false : null

  return {
    isCorrect,
    pointsAwarded,
    testCasesPassed: summary.passed,
    testCasesTotal: total,
    executionOutput: formatCodingTestRunSummary(summary),
    executionStatus:
      summary.passed === total
        ? "all_passed"
        : summary.worstStatus === "accepted"
          ? "partial"
          : summary.worstStatus,
  }
}
