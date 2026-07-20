import { generateText } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

import {
  cmsAiRateLimit,
  rateLimitResponse,
  withStaff,
} from "@/app/api/cms/_lib"
import { getOpenAiModel, requireOpenAiApiKey } from "@/lib/ai/model"

const bodySchema = z.object({
  title: z.string(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  return withStaff(async (user) => {
    const limit = cmsAiRateLimit(user.id)
    if (!limit.success) return rateLimitResponse(limit.resetAt)

    const body = bodySchema.parse(await req.json())
    requireOpenAiApiKey()

    const { text } = await generateText({
      model: getOpenAiModel(),
      temperature: 0.3,
      prompt: `Suggest 3-6 lowercase blog tags for this post. Return comma-separated tags only.\n\nTitle: ${body.title}\nExcerpt: ${body.excerpt ?? ""}\nContent: ${(body.content ?? "").slice(0, 2000)}`,
    })

    const suggested = text
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    const merged = [...new Set([...(body.tags ?? []), ...suggested])]
    return NextResponse.json({ tags: merged })
  })
}
