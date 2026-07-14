import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({
  // null / empty clears the org default.
  replyTo: z.union([z.string().email(), z.literal(""), z.null()]),
})

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can change the default reply-to" },
        { status: 403 },
      )
    }

    let body: z.infer<typeof schema>
    try {
      body = schema.parse(await req.json())
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    const value = body.replyTo ? body.replyTo : null
    const admin = createAdminClient()
    const { error } = await admin
      .from("organizations")
      .update({ default_reply_to: value })
      .eq("id", orgId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, default_reply_to: value })
  })
}
