import { NextResponse } from "next/server"
import { z } from "zod"

import {
  cmsAiRateLimit,
  rateLimitResponse,
  withStaff,
} from "@/app/api/cms/_lib"
import { requireOpenAiApiKey } from "@/lib/ai/model"

const bodySchema = z.object({
  title: z.string().min(1).max(300),
})

export async function POST(req: Request) {
  return withStaff(async (user) => {
    const limit = cmsAiRateLimit(user.id)
    if (!limit.success) return rateLimitResponse(limit.resetAt)

    const { title } = bodySchema.parse(await req.json())
    const apiKey = requireOpenAiApiKey()

    const prompt = `Editorial blog hero illustration for an article titled "${title}". Clean, professional, abstract, no text, suitable for a B2B SaaS hiring blog.`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)

    let res: Response
    try {
      res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          size: "1792x1024",
          quality: "standard",
          n: 1,
        }),
        signal: controller.signal,
      })
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { error: "Image generation timed out" },
          { status: 504 },
        )
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }

    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json(
        { error: detail || "Image generation failed" },
        { status: 502 },
      )
    }

    const json = (await res.json()) as {
      data?: Array<{ url?: string }>
    }
    const url = json.data?.[0]?.url
    if (!url) {
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: 502 },
      )
    }

    return NextResponse.json({ url })
  })
}
