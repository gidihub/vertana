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
})

const CATEGORIES = [
  "Guides",
  "Comparisons",
  "Compliance",
  "Hiring science",
  "Company",
] as const

export async function POST(req: Request) {
  return withStaff(async (user) => {
    const limit = cmsAiRateLimit(user.id)
    if (!limit.success) return rateLimitResponse(limit.resetAt)

    const body = bodySchema.parse(await req.json())
    requireOpenAiApiKey()

    const { text } = await generateText({
      model: getOpenAiModel(),
      temperature: 0.2,
      prompt: `Pick exactly one category from this list: ${CATEGORIES.join(", ")}. Return only the category name.\n\nTitle: ${body.title}\nExcerpt: ${body.excerpt ?? ""}`,
    })

    const category =
      CATEGORIES.find(
        (c) => c.toLowerCase() === text.trim().toLowerCase(),
      ) ?? "Guides"
    return NextResponse.json({ category })
  })
}
