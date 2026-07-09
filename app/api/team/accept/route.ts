import { NextResponse } from "next/server"
import { z } from "zod"

import { getAuthenticatedUser } from "@/lib/auth/session"
import { acceptTeamInviteByToken } from "@/lib/db/team"

const bodySchema = z.object({
  token: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user?.email) {
      return NextResponse.json({ error: "Sign in to accept this invite" }, { status: 401 })
    }

    const { token } = bodySchema.parse(await req.json())
    const result = await acceptTeamInviteByToken({
      token,
      userId: user.id,
      userEmail: user.email,
    })

    return NextResponse.json({ organization: result })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
