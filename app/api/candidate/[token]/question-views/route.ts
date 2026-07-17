import { NextResponse } from "next/server"
import { z } from "zod"

import { recordAttemptQuestionView } from "@/lib/db/queries"

const bodySchema = z
  .object({
    attemptId: z.string().uuid(),
    questionId: z.string().uuid(),
    enteredAt: z.string().datetime(),
    // A view window is only reported once it closes, so leftAt is always present
    // and must not precede enteredAt. This keeps every persisted window finite.
    leftAt: z.string().datetime(),
    answer: z.string().max(20000).nullable().optional(),
    answerChangeCount: z.number().int().min(0).max(100000).optional(),
  })
  .refine((v) => Date.parse(v.leftAt) >= Date.parse(v.enteredAt), {
    message: "leftAt must not be earlier than enteredAt",
    path: ["leftAt"],
  })

/**
 * Appends one completed per-question view window to the attempt's timing log,
 * powering the recruiter "Session playback" view. Token-gated like the other
 * candidate routes; best-effort telemetry, so a failure never blocks the
 * candidate's answer submission (the client fires this and does not await it).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const body = parsed.data

    await recordAttemptQuestionView({
      token,
      attemptId: body.attemptId,
      questionId: body.questionId,
      enteredAt: body.enteredAt,
      leftAt: body.leftAt,
      answer: body.answer ?? null,
      answerChangeCount: body.answerChangeCount,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Failed to record question view", err)
    return NextResponse.json(
      { error: "Failed to record question view" },
      { status: 500 },
    )
  }
}
