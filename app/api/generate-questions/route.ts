import { generateText, Output } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { getOpenAiModel, requireOpenAiApiKey } from "@/lib/ai/model"
import { AI_RESISTANCE_SELF_RATING_HINT } from "@/lib/ai/resistance-rubric"
import { MAX_CODING_TEST_CASES, clampTestCases } from "@/lib/coding/limits"
import {
  plannedQuestionSchema,
  testDetailsSuggestionSchema,
  testPlanSchema,
  type TestDetailsSuggestion,
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

function normalizeQuestion(
  q: TestPlanOutput["questions"][number],
): TestPlanOutput["questions"][number] {
  return {
    ...q,
    options: q.type === "multiple_choice" ? q.options.slice(0, 6) : [],
    correct_option_index:
      q.type === "multiple_choice" ? (q.correct_option_index ?? 0) : null,
    correct_answer_exact:
      q.type === "short_answer" ? (q.correct_answer_exact ?? null) : null,
    test_cases:
      q.type === "coding"
        ? clampTestCases(q.test_cases)
        : [],
    points: q.points ?? (q.type === "coding" ? 3 : 1),
  }
}

function normalizePlan(plan: TestPlanOutput): TestPlanOutput {
  return {
    ...plan,
    questions: plan.questions.map(normalizeQuestion),
  }
}

async function generatePlanFromBrief(brief: string): Promise<TestPlanOutput> {
  requireOpenAiApiKey()
  const { output } = await generateText({
    model: getOpenAiModel(),
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
- For each question include: type, prompt, options (MCQ only, exactly 4; empty array otherwise), correct_option_index (MCQ index or null), correct_answer_exact (short answer auto-grade string or null), points (number or null), estimated_minutes, difficulty (easy|medium|hard), ai_resistance (low|medium|high), and test_cases (array of {input, expected_output}; empty array for non-coding).
- For coding questions: include 2–${MAX_CODING_TEST_CASES} concrete test_cases with realistic stdin/stdout pairs that match the prompt. Programs should read from stdin and write to stdout. Use empty string for input when not needed. Never exceed ${MAX_CODING_TEST_CASES} test cases per question.
- ai_resistance: ${AI_RESISTANCE_SELF_RATING_HINT}
- Each question prompt must be unique, specific to the brief, and must NOT repeat the same template with suffixes like (Q2) or (variant 2).
- Keep prompts professional and concise. Between 4 and 10 questions unless the brief specifies otherwise.`,
  })
  return normalizePlan(output)
}

async function regenerateOneQuestion(input: {
  brief: string
  existingPrompt: string
  type: string
}): Promise<TestPlanOutput["questions"][number]> {
  requireOpenAiApiKey()
  const singleSchema = z.object({ question: plannedQuestionSchema })
  const { output } = await generateText({
    model: getOpenAiModel(),
    output: Output.object({ schema: singleSchema }),
    prompt: `Regenerate ONE replacement assessment question for this brief:
"""
${input.brief.slice(0, 1500)}
"""

Replace this question (same type preferred: ${input.type}):
"""
${input.existingPrompt}
"""

Make it meaningfully different but still aligned to the brief. Include ai_resistance self-rating. For coding type, include 2–${MAX_CODING_TEST_CASES} test_cases with input/expected_output pairs (max ${MAX_CODING_TEST_CASES}).`,
  })
  return normalizeQuestion(output.question)
}

const suggestDetailsInputSchema = z.object({
  type: z.enum(["multiple_choice", "short_answer", "coding"]),
  prompt: z.string(),
  estimated_minutes: z.number().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
})

async function suggestDetailsFromQuestions(
  questions: z.infer<typeof suggestDetailsInputSchema>[],
): Promise<TestDetailsSuggestion> {
  requireOpenAiApiKey()
  const summary = questions
    .map(
      (q, i) =>
        `${i + 1}. [${q.type}] ${q.prompt.slice(0, 300)}${
          q.estimated_minutes ? ` (~${q.estimated_minutes} min)` : ""
        }${q.difficulty ? ` · ${q.difficulty}` : ""}`,
    )
    .join("\n")

  const { output } = await generateText({
    model: getOpenAiModel(),
    output: Output.object({ schema: testDetailsSuggestionSchema }),
    prompt: `You are helping a recruiter finish an assessment they already built. Based ONLY on the questions below, suggest candidate-facing test metadata.

Questions:
"""
${summary}
"""

Requirements:
- title: concise professional assessment name (e.g. "Frontend Engineer Screening"), not generic like "Test"
- description: 2–3 sentences for candidates explaining what the assessment covers and how to approach it. Plain, welcoming tone.
- time_limit_minutes: realistic total timed duration including reading/thinking buffer (typically sum of per-question estimates + 10–20%, rounded to a sensible number, minimum 15)
- suggested_deadline: null unless the question topics clearly imply urgency; prefer null`,
  })

  return {
    ...output,
    time_limit_minutes: Math.min(Math.max(Math.round(output.time_limit_minutes), 15), 240),
  }
}

function aiErrorResponse(err: unknown): NextResponse {
  const message =
    err instanceof Error ? err.message : "AI generation failed unexpectedly"
  console.error("[vertana] AI plan failed:", message)
  const status = message.includes("limit reached")
    ? 402
    : message.includes("OPENAI_API_KEY")
      ? 503
      : 502
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: Request) {
  return handleApiAuth(async () => {
    const body = (await req.json()) as {
      brief?: string
      role?: string
      count?: number
      regenerate?: { prompt: string; type: string }
      suggestDetails?: boolean
      questions?: z.infer<typeof suggestDetailsInputSchema>[]
    }

    try {
      const org = await ensureMonthlyResets(await getOrganization())
      const limit = aiLimitForTier(org.plan_tier)
      if (!org.is_comp && org.ai_generations_used >= limit) {
        return NextResponse.json(
          {
            error: `Monthly AI generation limit reached (${limit}). Upgrade your plan or wait until ${new Date(org.ai_generations_reset_at).toLocaleDateString()}.`,
          },
          { status: 402 },
        )
      }

      requireOpenAiApiKey()

      if (body.suggestDetails) {
        const parsed = z.array(suggestDetailsInputSchema).safeParse(body.questions ?? [])
        if (!parsed.success || parsed.data.length === 0) {
          return NextResponse.json(
            { error: "Add at least one question before suggesting details" },
            { status: 400 },
          )
        }
        const filled = parsed.data.filter((q) => q.prompt.trim())
        if (filled.length === 0) {
          return NextResponse.json(
            { error: "Questions need prompts before suggesting details" },
            { status: 400 },
          )
        }
        const details = await suggestDetailsFromQuestions(filled)
        await incrementAiUsage(org.id, org.ai_generations_used)
        return NextResponse.json({ details, source: "ai" })
      }

      const brief = String(body.brief ?? body.role ?? "").trim()
      if (!brief) {
        return NextResponse.json({ error: "Brief is required" }, { status: 400 })
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
          model: getOpenAiModel(),
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
      const result = aiErrorResponse(err)
      if (result instanceof NextResponse) return result
      throw err
    }
  })
}
