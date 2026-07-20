import { generateText } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

import {
  cmsAiRateLimit,
  rateLimitResponse,
  withStaff,
} from "@/app/api/cms/_lib"
import { getOpenAiModel, requireOpenAiApiKey } from "@/lib/ai/model"

const FORMAT_SYSTEM = `Use <h2> for main headings, <h3> for sub-headings, <p> for paragraphs,
<ul>/<ol><li> for lists, <strong>/<em> for emphasis. Preserve existing structure.
Do NOT include <html>/<body>/wrapper divs. Do NOT change wording. Output ONLY the
HTML fragment — no explanation, no markdown code fences.`

const bodySchema = z.object({
  content: z.string(),
})

function decodeDoubleEncoded(html: string): string {
  if (!/&lt;|&gt;|&amp;/.test(html)) return html
  return html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```html?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}

export async function POST(req: Request) {
  return withStaff(async (user) => {
    const limit = cmsAiRateLimit(user.id)
    if (!limit.success) return rateLimitResponse(limit.resetAt)

    const { content } = bodySchema.parse(await req.json())
    const decoded = decodeDoubleEncoded(content)

    if (
      decoded.includes("<h2") ||
      decoded.includes("<p>") ||
      decoded.includes("<ul")
    ) {
      return NextResponse.json({ html: decoded })
    }

    requireOpenAiApiKey()
    const plain = decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    const { text } = await generateText({
      model: getOpenAiModel(),
      temperature: 0.2,
      system: FORMAT_SYSTEM,
      prompt: plain,
    })

    return NextResponse.json({ html: stripCodeFences(text) })
  })
}
