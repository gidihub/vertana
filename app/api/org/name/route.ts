import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({
  name: z.string().trim().min(1).max(100),
})

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can rename the organization" },
        { status: 403 },
      )
    }

    let body: z.infer<typeof schema>
    try {
      body = schema.parse(await req.json())
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("organizations")
      .update({ name: body.name })
      .eq("id", orgId)

    if (error) {
      console.error("Failed to rename organization", error)
      return NextResponse.json(
        { error: "Failed to rename organization" },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, name: body.name })
  })
}
