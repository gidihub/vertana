import { NextResponse } from "next/server"

import { setupOrganizationForUser } from "@/lib/auth/recruiter"
import { getAuthenticatedUser } from "@/lib/auth/session"

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Not signed in. If you just signed up, confirm your email first, then sign in.",
        },
        { status: 401 },
      )
    }

    const { orgName } = (await req.json()) as { orgName?: string }
    const result = await setupOrganizationForUser({
      userId: user.id,
      orgName: orgName?.trim() || "My Organization",
    })

    return NextResponse.json({ organization: result })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
