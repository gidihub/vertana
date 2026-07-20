import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin } from "@/app/api/cms/_lib"
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit"

const FEEDBACK_LIMIT = 5
const FEEDBACK_WINDOW_MS = 60_000

const bodySchema = z.object({
  message: z.string().trim().min(1).max(5000),
  email: z.string().email().optional().or(z.literal("")),
  page_url: z.string().url().optional().or(z.literal("")),
})

export async function POST(req: Request) {
  const limit = checkRateLimit({
    key: clientIpFromRequest(req),
    namespace: "feedback:ip",
    limit: FEEDBACK_LIMIT,
    windowMs: FEEDBACK_WINDOW_MS,
  })
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many submissions. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    )
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (err) {
    const message =
      err instanceof z.ZodError ? "Invalid request" : "Invalid request"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const admin = cmsAdmin()

  const { data, error } = await admin
    .from("cms_feedback")
    .insert({
      message: body.message.trim(),
      email: body.email?.trim() || null,
      page_url: body.page_url?.trim() || null,
      status: "new",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
