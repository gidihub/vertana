import { NextResponse } from "next/server"
import { z } from "zod"

import { enableShareForCheck } from "@/lib/tools/ai-solvability"

const bodySchema = z.object({
  checkId: z.string().uuid(),
})

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const share = await enableShareForCheck(body.checkId)
  if (!share) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 })
  }

  return NextResponse.json(share)
}
