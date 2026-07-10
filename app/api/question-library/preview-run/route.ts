import { z } from "zod"
import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"
import { rowToQuestion, type QuestionRow } from "@/lib/db/mappers"
import {
  formatCodingTestRunSummary,
  runCodingTestCases,
} from "@/lib/execution/run-coding-tests"

const bodySchema = z.object({
  questionId: z.string().uuid(),
  code: z.string().max(100_000),
  language: z.enum(["javascript", "python", "typescript"]),
})

const PREVIEW_RUN_USER_LIMIT = 20
const PREVIEW_RUN_IP_LIMIT = 40
const PREVIEW_RUN_WINDOW_MS = 60_000

export async function POST(req: Request) {
  return handleApiAuth(async (ctx) => {
    try {
      const userLimit = checkRateLimit({
        key: ctx.user.id,
        namespace: "preview-run:user",
        limit: PREVIEW_RUN_USER_LIMIT,
        windowMs: PREVIEW_RUN_WINDOW_MS,
      })
      const ipLimit = checkRateLimit({
        key: clientIpFromRequest(req),
        namespace: "preview-run:ip",
        limit: PREVIEW_RUN_IP_LIMIT,
        windowMs: PREVIEW_RUN_WINDOW_MS,
      })

      if (!userLimit.success || !ipLimit.success) {
        const resetAt = Math.max(userLimit.resetAt, ipLimit.resetAt)
        const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
        return NextResponse.json(
          { error: "Too many preview runs. Try again shortly." },
          {
            status: 429,
            headers: { "Retry-After": String(retryAfter) },
          },
        )
      }

      const body = bodySchema.parse(await req.json())
      const supabase = createAdminClient()

      const { data: row, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", body.questionId)
        .eq("is_library_item", true)
        .maybeSingle()

      if (error || !row) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 })
      }

      const question = rowToQuestion(row as QuestionRow)
      const testCases = question.test_cases ?? []
      if (!testCases.length) {
        return NextResponse.json(
          { error: "This coding question has no test cases to run against." },
          { status: 400 },
        )
      }

      const summary = await runCodingTestCases({
        code: body.code,
        language: body.language,
        testCases,
      })

      return NextResponse.json({
        passed: summary.passed,
        total: summary.total,
        results: summary.results,
        status:
          summary.passed === summary.total
            ? "all_passed"
            : summary.worstStatus === "accepted"
              ? "partial"
              : summary.worstStatus,
        output: formatCodingTestRunSummary(summary),
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Preview execution failed"
      const status = message.includes("JUDGE0_API_KEY") ? 503 : 400
      return NextResponse.json({ error: message }, { status })
    }
  })
}
