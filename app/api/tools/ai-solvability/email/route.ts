import { NextResponse } from "next/server"
import { z } from "zod"

import { recordSolvabilityEmailLead } from "@/lib/tools/ai-solvability"
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit"

const bodySchema = z.object({
  checkId: z.string().uuid(),
  email: z.string().email(),
})

export async function POST(req: Request) {
  const limit = checkRateLimit({
    key: clientIpFromRequest(req),
    namespace: "solvability:email:ip",
    limit: 3,
    windowMs: 86_400_000,
  })

  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again tomorrow." },
      { status: 429 },
    )
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const ok = await recordSolvabilityEmailLead(body)
  if (!ok) {
    return NextResponse.json({ error: "Could not save email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
