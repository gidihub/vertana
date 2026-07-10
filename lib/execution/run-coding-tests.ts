import type { TestCase } from "@/lib/types"
import type { CodingLanguageId } from "@/lib/coding/languages"
import { recordCodeExecutions } from "@/lib/org"
import { executeCode, outputsMatch, type ExecutionResult } from "@/lib/execution/judge0"

export interface CodingTestRunResult {
  index: number
  input: string
  expected: string
  actual: string
  passed: boolean
  status: string
  stderr: string
}

export interface CodingTestRunSummary {
  passed: number
  total: number
  results: CodingTestRunResult[]
  worstStatus: ExecutionResult["status"] | "internal_error"
}

export async function runCodingTestCases(input: {
  code: string
  language: CodingLanguageId
  testCases: TestCase[]
  /** When set, each execution is metered against org usage. */
  orgId?: string
}): Promise<CodingTestRunSummary> {
  const results: CodingTestRunResult[] = []
  let passed = 0
  let worstErrorStatus: CodingTestRunSummary["worstStatus"] | null = null

  for (let i = 0; i < input.testCases.length; i++) {
    const tc = input.testCases[i]
    let result: ExecutionResult
    try {
      result = await executeCode({
        code: input.code,
        language: input.language,
        stdin: tc.input,
      })
      if (input.orgId) {
        await recordCodeExecutions(input.orgId, 1)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed"
      results.push({
        index: i,
        input: tc.input,
        expected: tc.expected_output,
        actual: "",
        passed: false,
        status: "internal_error",
        stderr: message,
      })
      worstErrorStatus = "internal_error"
      continue
    }

    if (result.status !== "accepted" && result.status !== "wrong_answer") {
      worstErrorStatus = result.status
    }

    const actual = result.stdout
    const ok =
      result.status === "accepted" &&
      outputsMatch(actual, tc.expected_output)

    if (ok) passed += 1

    results.push({
      index: i,
      input: tc.input,
      expected: tc.expected_output,
      actual,
      passed: ok,
      status: result.status,
      stderr: [result.stderr, result.compileOutput].filter(Boolean).join("\n"),
    })
  }

  const total = input.testCases.length
  const worstStatus: CodingTestRunSummary["worstStatus"] =
    worstErrorStatus ?? (passed === 0 ? "wrong_answer" : "accepted")

  return { passed, total, results, worstStatus }
}

export function formatCodingTestRunSummary(summary: CodingTestRunSummary): string {
  return summary.results
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
