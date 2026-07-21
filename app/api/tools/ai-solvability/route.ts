import { NextResponse } from "next/server"
import { z } from "zod"

import {
  checkSolvabilityRateLimit,
  solvabilityRateLimitMessage,
} from "@/lib/tools/ai-solvability-rate-limit"
import {
  checkSolvabilitySpendCeiling,
  isSolvabilityKillSwitchActive,
  recordSolvabilitySpend,
} from "@/lib/tools/ai-solvability-spend"
import {
  QUESTION_TYPES,
  hashQuestion,
  runSolvabilityCheck,
  validateQuestionInput,
} from "@/lib/tools/ai-solvability"
import { clientIpFromRequest } from "@/lib/rate-limit"

export const maxDuration = 60

const bodySchema = z.object({
  question: z.string(),
  questionType: z.enum(QUESTION_TYPES).optional().nullable(),
  roleContext: z.string().trim().max(120).optional().nullable(),
})

export async function POST(req: Request) {
  if (isSolvabilityKillSwitchActive()) {
    return NextResponse.json(
      {
        error: "unavailable",
        message:
          "The checker is briefly unavailable while we catch up on demand. Please try again in a little while.",
      },
      { status: 503 },
    )
  }

  const spend = checkSolvabilitySpendCeiling()
  if (!spend.allowed) {
    return NextResponse.json(
      {
        error: "unavailable",
        message:
          "The checker is briefly unavailable while we catch up on demand. Please try again in a little while.",
      },
      { status: 503 },
    )
  }

  const ip = clientIpFromRequest(req)
  const rate = checkSolvabilityRateLimit(ip)
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        reason: rate.reason,
        message: solvabilityRateLimitMessage(rate.reason),
        signupUrl: "/signup",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rate.resetAt - Date.now()) / 1000),
          ),
        },
      },
    )
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const validation = validateQuestionInput(body.question)
  if (!validation.ok) {
    return NextResponse.json(
      { error: "invalid_question", message: validation.message },
      { status: 400 },
    )
  }

  try {
    const questionHash = hashQuestion(body.question)
    const result = await runSolvabilityCheck({
      question: body.question.trim(),
      questionType: body.questionType,
      roleContext: body.roleContext,
    })

    if (!result.cached) {
      recordSolvabilitySpend()
    }

    return NextResponse.json({
      ...result,
      questionHash,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not run the check."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
