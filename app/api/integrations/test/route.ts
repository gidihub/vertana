import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { dispatchTestEvent } from "@/lib/integrations/dispatch"

const schema = z.object({ provider: z.string().min(1) })

/**
 * Enqueues a synthetic `attempt.submitted` event to one connected provider so an
 * owner/admin can confirm wiring without running a real assessment.
 */
export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can manage integrations" },
        { status: 403 },
      )
    }

    let provider: string
    try {
      provider = schema.parse(await req.json()).provider
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    try {
      const result = await dispatchTestEvent(orgId, provider)
      return NextResponse.json({ ok: true, ...result })
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
  })
}
