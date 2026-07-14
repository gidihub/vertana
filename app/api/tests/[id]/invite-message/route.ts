import { generateText } from "ai"
import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { getOpenAiModel, requireOpenAiApiKey } from "@/lib/ai/model"
import { loadTestById } from "@/lib/db/queries"
import { checkRateLimit } from "@/lib/rate-limit"

export const maxDuration = 30

// Lightweight abuse guard: cap AI note drafts per recruiter.
const RATE_LIMIT = 15
const RATE_WINDOW_MS = 60_000

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async (ctx) => {
    const rl = checkRateLimit({
      namespace: "invite-message",
      key: ctx.user.id,
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    })
    if (!rl.success) {
      const retryInSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: `Too many message drafts. Try again in ${retryInSec}s.`,
        },
        { status: 429, headers: { "Retry-After": String(retryInSec) } },
      )
    }

    const { id } = await params
    const test = await loadTestById(id)
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    try {
      requireOpenAiApiKey()

      const topics = test.questions
        .slice(0, 8)
        .map((q) => q.prompt.trim())
        .filter(Boolean)
        .map((p, i) => `${i + 1}. ${p.slice(0, 160)}`)
        .join("\n")

      const { text } = await generateText({
        model: getOpenAiModel(),
        prompt: `Write a short, warm personal note from a recruiter to a candidate, to be shown at the top of an assessment invitation email. This note appears ABOVE the standard invitation details (test link, duration, deadline), so do NOT repeat logistics, links, or a subject line.

Assessment: "${test.title}"
${test.description ? `Description: ${test.description.slice(0, 600)}\n` : ""}${
          test.time_limit_minutes
            ? `Approximate duration: ${test.time_limit_minutes} minutes\n`
            : ""
        }${topics ? `Sample question topics:\n${topics}\n` : ""}
Requirements:
- 2–4 sentences, friendly and professional.
- Address the candidate directly ("you"), but do NOT include a greeting line like "Hi {name}," or a sign-off — just the body.
- Briefly convey what the assessment covers and encourage them to do their best.
- Plain text only. No markdown, no bullet points, no placeholders in braces.
- Return ONLY the note text.`,
      })

      const message = text.trim()
      if (!message) {
        return NextResponse.json(
          { error: "AI returned an empty message. Try again." },
          { status: 502 },
        )
      }
      return NextResponse.json({ message, source: "ai" })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "AI generation failed unexpectedly"
      const status = msg.includes("OPENAI_API_KEY") ? 503 : 502
      return NextResponse.json({ error: msg }, { status })
    }
  })
}
