import { z } from "zod"

export const testCaseSchema = z.object({
  input: z.string(),
  expected_output: z.string(),
})

export const plannedQuestionSchema = z.object({
  type: z.enum(["multiple_choice", "short_answer", "coding"]),
  prompt: z.string(),
  options: z.array(z.string()),
  correct_option_index: z.number().nullable(),
  // OpenAI strict JSON schema requires every property in `required`; use null when N/A.
  correct_answer_exact: z.string().nullable(),
  ai_resistance: z.enum(["low", "medium", "high"]),
  estimated_minutes: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().nullable(),
  test_cases: z.array(testCaseSchema),
})

export const testPlanSchema = z.object({
  total_time_minutes: z.number(),
  question_count: z.number(),
  summary: z.string(),
  questions: z.array(plannedQuestionSchema),
})

export type PlannedQuestionOutput = z.infer<typeof plannedQuestionSchema>
export type TestPlanOutput = z.infer<typeof testPlanSchema>

export const testDetailsSuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  time_limit_minutes: z.number(),
  suggested_deadline: z.string().nullable(),
})

export type TestDetailsSuggestion = z.infer<typeof testDetailsSuggestionSchema>

export function fallbackPlanFromBrief(brief: string): TestPlanOutput {
  const lower = brief.toLowerCase()
  const wantsCoding = /coding|code|challenge/.test(lower)
  const wantsMcq = /mcq|multiple|choice/.test(lower)
  const timeMatch = brief.match(/(\d+)\s*(?:min|minute)/i)
  const total = timeMatch ? Number(timeMatch[1]) : 45
  const countMatch = brief.match(/(\d+)\s*questions?/i)
  const count = countMatch ? Math.min(Number(countMatch[1]), 10) : wantsCoding ? 6 : 5

  const role =
    brief.split(",")[0]?.trim().slice(0, 80) || "General technical role"

  const templates: PlannedQuestionOutput[] = [
    {
      type: "multiple_choice",
      prompt: `For a ${role}, which practice best reduces production incidents?`,
      options: [
        "Ship without monitoring to move faster",
        "Canary releases with automated rollback",
        "Disable staging environments",
        "Avoid post-incident reviews",
      ],
      correct_option_index: 1,
      correct_answer_exact: null,
      ai_resistance: "low",
      estimated_minutes: 3,
      difficulty: "easy",
      points: null,
      test_cases: [],
    },
    {
      type: "short_answer",
      prompt: `Describe how you would scope and deliver a ${role} project with a tight deadline.`,
      options: [],
      correct_option_index: null,
      correct_answer_exact: null,
      ai_resistance: "medium",
      estimated_minutes: 6,
      difficulty: "medium",
      points: null,
      test_cases: [],
    },
    {
      type: "coding",
      prompt: `Live coding: implement a small utility relevant to a ${role} using the constraints in the brief.`,
      options: [],
      correct_option_index: null,
      correct_answer_exact: null,
      ai_resistance: "high",
      estimated_minutes: 15,
      difficulty: "hard",
      points: null,
      test_cases: [
        { input: "hello", expected_output: "HELLO" },
        { input: "world", expected_output: "WORLD" },
        { input: "", expected_output: "" },
      ],
    },
  ]

  const questions: PlannedQuestionOutput[] = []
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length]
    if (!wantsMcq && t.type === "multiple_choice" && i > 0) {
      questions.push({ ...templates[1], prompt: templates[1].prompt + ` (variant ${i + 1})` })
      continue
    }
    if (!wantsCoding && t.type === "coding" && count < 4) {
      questions.push({ ...templates[0] })
      continue
    }
    questions.push({
      ...t,
      prompt: i === 0 ? t.prompt : `${t.prompt} (Q${i + 1})`,
    })
  }

  const perQ = Math.max(3, Math.round(total / questions.length))

  return {
    total_time_minutes: total,
    question_count: questions.length,
    summary: `Structured plan for: ${role}. Mix of verification, applied reasoning, and hands-on tasks aligned to your brief.`,
    questions: questions.map((q) => ({
      ...q,
      estimated_minutes: q.estimated_minutes || perQ,
    })),
  }
}
