import { openai } from "@ai-sdk/openai"
import { generateText, Output } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import {
  fallbackPlanFromBrief,
  plannedQuestionSchema,
  testPlanSchema,
  type TestPlanOutput,
} from "@/lib/ai/plan-schema"
import { aiLimitForTier } from "@/lib/plans"
import { getOrganization, ensureMonthlyResets } from "@/lib/org"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 60

const legacyQuestionSchema = z.object({
  questions: z.array(
    plannedQuestionSchema.omit({
      ai_resistance: true,
      estimated_minutes: true,
      difficulty: true,
    }),
  ),
})

async function incrementAiUsage(orgId: string, current: number) {
  const supabase = createAdminClient()
  await supabase
    .from("organizations")
    .update({ ai_generations_used: current + 1 })
    .eq("id", orgId)
}

function normalizePlan(plan: TestPlanOutput): TestPlanOutput {
  return {
    ...plan,
    questions: plan.questions.map((q) => ({
      ...q,
      options: q.type === "multiple_choice" ? q.options.slice(0, 6) : [],
      correct_option_index:
        q.type === "multiple_choice" ? (q.correct_option_index ?? 0) : null,
      correct_answer_exact:
        q.type === "short_answer" ? (q.correct_answer_exact ?? null) : null,
      points: q.points ?? (q.type === "coding" ? 3 : 1),
    })),
  }
}

async function generatePlanFromBrief(brief: string): Promise<TestPlanOutput> {
  const { output } = await generateText({
    model: openai("gpt-5.4-mini"),
    output: Output.object({ schema: testPlanSchema }),
    prompt: `You are designing a hiring assessment. Read this recruiter brief and produce a structured test plan (not final copy yet — a reviewable proposal).

Brief:
"""
${brief.slice(0, 2000)}
"""

Requirements:
- Propose total_time_minutes and question_count that fit the brief.
- Include a one-sentence summary of the assessment strategy.
- Mix question types appropriately (multiple_choice, short_answer, coding).
- For each question include: type, prompt, options (MCQ only, exactly 4), correct_option_index (MCQ), optional correct_answer_exact (short answer auto-grade), estimated_minutes, difficulty (easy|medium|hard), and ai_resistance (low|medium|high).
- ai_resistance: rate how easily a chatbot could answer without seeing the live assessment context. Generic definitional MCQs = low. Role-specific scenarios, debugging with provided snippets, or multi-step reasoning = medium/high.
- Keep prompts professional and concise. Between 4 and 10 questions unless the brief specifies otherwise.`,
  })
  return normalizePlan(output)
}

async function regenerateOneQuestion(input: {
  brief: string
  existingPrompt: string
  type: string
}): Promise<TestPlanOutput["questions"][number]> {
  const singleSchema = z.object({ question: plannedQuestionSchema })
  const { output } = await generateText({
    model: openai("gpt-5.4-mini"),
    output: Output.object({ schema: singleSchema }),
    prompt: `Regenerate ONE replacement assessment question for this brief:
"""
${input.brief.slice(0, 1500)}
"""

Replace this question (same type preferred: ${input.type}):
"""
${input.existingPrompt}
"""

Make it meaningfully different but still aligned to the brief. Include ai_resistance self-rating.`,
  })
  return output.question
}

export async function POST(req: Request) {
  return handleApiAuth(async () => {
    const body = (await req.json()) as {
      brief?: string
      role?: string
      count?: number
      regenerate?: { prompt: string; type: string }
    }

    const brief = String(body.brief ?? body.role ?? "").trim()
    if (!brief) {
      return NextResponse.json({ error: "Brief is required" }, { status: 400 })
    }

    try {
      const org = await ensureMonthlyResets(await getOrganization())
      const limit = aiLimitForTier(org.plan_tier)
      if (org.ai_generations_used >= limit) {
        return NextResponse.json(
          {
            error: `Monthly AI generation limit reached (${limit}). Upgrade your plan or wait until ${new Date(org.ai_generations_reset_at).toLocaleDateString()}.`,
          },
          { status: 402 },
        )
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured")
      }

      if (body.regenerate) {
        const question = await regenerateOneQuestion({
          brief,
          existingPrompt: body.regenerate.prompt,
          type: body.regenerate.type,
        })
        await incrementAiUsage(org.id, org.ai_generations_used)
        return NextResponse.json({ question, source: "ai" })
      }

      // Legacy flat list (role + count) still supported
      if (body.role && body.count && !body.brief) {
        const safeCount = Math.min(Math.max(Number(body.count) || 3, 1), 10)
        const { output } = await generateText({
          model: openai("gpt-5.4-mini"),
          output: Output.object({ schema: legacyQuestionSchema }),
          prompt: `Generate ${safeCount} interview questions for "${brief}".`,
        })
        await incrementAiUsage(org.id, org.ai_generations_used)
        return NextResponse.json({
          questions: output.questions,
          source: "ai",
        })
      }

      const plan = await generatePlanFromBrief(brief)
      await incrementAiUsage(org.id, org.ai_generations_used)
      return NextResponse.json({ plan, source: "ai" })
    } catch (err) {
      console.log("[vertana] AI plan failed:", (err as Error).message)
      const message = (err as Error).message
      if (message.includes("limit reached")) {
        return NextResponse.json({ error: message }, { status: 402 })
      }

      if (body.regenerate) {
        const plan = fallbackPlanFromBrief(brief)
        return NextResponse.json({
          question: plan.questions[0],
          source: "fallback",
        })
      }

      return NextResponse.json({
        plan: fallbackPlanFromBrief(brief),
        source: "fallback",
      })
    }
  })
}
