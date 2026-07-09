import type { TestCase } from "@/lib/types"
import { parseCodingResponse } from "@/lib/coding/response"
import { recordCodeExecutions } from "@/lib/org"
import { executeCode, outputsMatch, type ExecutionResult } from "@/lib/execution/judge0"

export interface CodingGradeResult {
  isCorrect: boolean | null
  pointsAwarded: number
  testCasesPassed: number
  testCasesTotal: number
  executionOutput: string
  executionStatus: string
}

function formatRunSummary(
  results: Array<{
    index: number
    input: string
    expected: string
    actual: string
    passed: boolean
    status: string
    stderr: string
  }>,
): string {
  return results
    .map((r) => {
      const header = `Test ${r.index + 1}: ${r.passed ? "PASS" : "FAIL"} (${r.status})`
      const lines = [header]
      if (r.input) lines.push(`Input:\n${r.input}`)
      lines.push(`Expected:\n${r.expected || "(empty)"}`)
      lines.push(`Actual:\n${r.actual || "(empty)"}`)
      if (r.stderr) lines.push(`Stderr:\n${r.stderr}`)
      return lines.join("\n")
    })
    .join("\n\n---\n\n")
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

  const runResults: Array<{
    index: number
    input: string
    expected: string
    actual: string
    passed: boolean
    status: string
    stderr: string
  }> = []

  let passed = 0
  let worstStatus: ExecutionResult["status"] = "accepted"

  for (let i = 0; i < input.testCases.length; i++) {
    const tc = input.testCases[i]
    let result: ExecutionResult
    try {
      result = await executeCode({
        code: payload.code,
        language: payload.language,
        stdin: tc.input,
      })
      if (input.orgId) {
        await recordCodeExecutions(input.orgId, 1)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed"
      runResults.push({
        index: i,
        input: tc.input,
        expected: tc.expected_output,
        actual: "",
        passed: false,
        status: "internal_error",
        stderr: message,
      })
      worstStatus = "internal_error"
      continue
    }

    if (result.status !== "accepted" && result.status !== "wrong_answer") {
      worstStatus = result.status
    }

    const actual = result.stdout
    const ok =
      result.status === "accepted" &&
      outputsMatch(actual, tc.expected_output)

    if (ok) passed += 1

    runResults.push({
      index: i,
      input: tc.input,
      expected: tc.expected_output,
      actual,
      passed: ok,
      status: result.status,
      stderr: [result.stderr, result.compileOutput].filter(Boolean).join("\n"),
    })
  }

  const ratio = total > 0 ? passed / total : 0
  const pointsAwarded = Math.round(input.maxPoints * ratio * 100) / 100
  const isCorrect = passed === total ? true : passed === 0 ? false : null

  return {
    isCorrect,
    pointsAwarded,
    testCasesPassed: passed,
    testCasesTotal: total,
    executionOutput: formatRunSummary(runResults),
    executionStatus:
      passed === total ? "all_passed" : worstStatus === "accepted" ? "partial" : worstStatus,
  }
}
