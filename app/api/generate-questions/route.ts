import { generateText, Output } from "ai"
import { z } from "zod"

export const maxDuration = 30

const questionSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["multiple_choice", "short_answer", "coding"]),
      prompt: z.string(),
      // Provide 4 options for multiple_choice, empty array otherwise.
      options: z.array(z.string()),
      // Index of the correct option for multiple_choice, null otherwise.
      correct_option_index: z.number().nullable(),
    }),
  ),
})

type GeneratedQuestion = z.infer<typeof questionSchema>["questions"][number]

// Local fallback so the reviewer UI always works, even without an AI Gateway key.
function fallbackQuestions(role: string, count: number): GeneratedQuestion[] {
  const templates: GeneratedQuestion[] = [
    {
      type: "multiple_choice",
      prompt: `Which skill is most critical for a ${role}?`,
      options: [
        "Communication and collaboration",
        "Domain expertise",
        "Attention to detail",
        "All of the above",
      ],
      correct_option_index: 3,
    },
    {
      type: "short_answer",
      prompt: `Describe a challenging problem you solved as a ${role} and your approach.`,
      options: [],
      correct_option_index: null,
    },
    {
      type: "coding",
      prompt: `Write a small function or pseudo-code that a ${role} would use to solve a common task in the role.`,
      options: [],
      correct_option_index: null,
    },
    {
      type: "multiple_choice",
      prompt: `A ${role} is asked to prioritize competing tasks. What should they do first?`,
      options: [
        "Start with the easiest task",
        "Clarify impact and deadlines, then prioritize",
        "Do everything at once",
        "Wait for more instructions",
      ],
      correct_option_index: 1,
    },
    {
      type: "short_answer",
      prompt: `What does quality work look like for a ${role}?`,
      options: [],
      correct_option_index: null,
    },
  ]
  const out: GeneratedQuestion[] = []
  for (let i = 0; i < count; i++) out.push(templates[i % templates.length])
  return out
}

export async function POST(req: Request) {
  const { role, count } = await req.json()
  const safeCount = Math.min(Math.max(Number(count) || 3, 1), 10)
  const safeRole = String(role || "candidate").slice(0, 120)

  try {
    const { output } = await generateText({
      model: "openai/gpt-4.1-mini",
      output: Output.object({ schema: questionSchema }),
      prompt: `Generate ${safeCount} diverse interview assessment questions for a "${safeRole}" role.
Mix multiple_choice, short_answer, and coding types where appropriate.
For every multiple_choice question, include exactly 4 plausible options and set correct_option_index to the 0-based index of the correct one.
For short_answer and coding questions, use an empty options array and set correct_option_index to null.
Keep prompts concise and professional.`,
    })

    const questions = output.questions.slice(0, safeCount).map((q) => ({
      ...q,
      options: q.type === "multiple_choice" ? q.options.slice(0, 6) : [],
      correct_option_index:
        q.type === "multiple_choice" ? q.correct_option_index ?? 0 : null,
    }))

    return Response.json({ questions, source: "ai" })
  } catch (err) {
    console.log("[v0] AI generation failed, using fallback:", (err as Error).message)
    return Response.json({
      questions: fallbackQuestions(safeRole, safeCount),
      source: "fallback",
    })
  }
}
