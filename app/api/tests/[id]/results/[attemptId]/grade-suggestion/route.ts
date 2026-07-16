import { generateText, Output } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { getOpenAiModel, requireOpenAiApiKey } from "@/lib/ai/model"
import {
  loadGradeSuggestionContext,
  saveGradeSuggestion,
} from "@/lib/db/queries"

export const maxDuration = 30

const bodySchema = z.object({ questionId: z.string().uuid() })

const suggestionSchema = z.object({
  score: z.number(),
  rationale: z.string(),
})

/**
 * Advisory AI grading suggestion for a single free-text answer. Returns a
 * cached suggestion when one exists (so it isn't recomputed on every view),
 * otherwise runs the model once and stores the result. The suggestion never
 * writes the actual grade — the recruiter's Accept/Override does that.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
) {
  return handleApiAuth(async () => {
    const { id, attemptId } = await params
    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const ctx = await loadGradeSuggestionContext({
      testId: id,
      attemptId,
      questionId: parsed.data.questionId,
    })

    if (ctx.cached) {
      return NextResponse.json({
        suggestedScore: ctx.cached.points,
        rationale: ctx.cached.rationale,
        maxPoints: ctx.maxPoints,
        cached: true,
      })
    }

    if (!ctx.response.trim()) {
      const rationale = "No answer was submitted for this question."
      await saveGradeSuggestion({
        attemptId,
        questionId: parsed.data.questionId,
        points: 0,
        rationale,
      })
      return NextResponse.json({
        suggestedScore: 0,
        rationale,
        maxPoints: ctx.maxPoints,
        cached: false,
      })
    }

    requireOpenAiApiKey()
    const { output } = await generateText({
      model: getOpenAiModel(),
      output: Output.object({ schema: suggestionSchema }),
      prompt: `You are grading a candidate's free-text answer to a hiring-assessment question. Award an integer score from 0 to ${ctx.maxPoints} (partial credit allowed).

Question:
"""
${ctx.prompt.slice(0, 1500)}
"""
${
  ctx.expected
    ? `\nReference / expected answer:\n"""\n${ctx.expected.slice(0, 1500)}\n"""\n`
    : ""
}
Candidate answer:
"""
${ctx.response.slice(0, 3000)}
"""

Return:
- score: an integer between 0 and ${ctx.maxPoints}.
- rationale: one concise sentence (max ~200 characters) explaining the score. Be strict but fair; reward correct reasoning, penalize vague or incorrect answers.`,
    })

    const points = Math.max(
      0,
      Math.min(ctx.maxPoints, Math.round(output.score)),
    )
    const rationale = output.rationale.trim().slice(0, 400)
    await saveGradeSuggestion({
      attemptId,
      questionId: parsed.data.questionId,
      points,
      rationale,
    })

    return NextResponse.json({
      suggestedScore: points,
      rationale,
      maxPoints: ctx.maxPoints,
      cached: false,
    })
  })
}
