import { NextResponse } from "next/server"

import { checkCandidateStatus } from "@/lib/db/queries"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const email = new URL(req.url).searchParams.get("email")?.trim()
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const status = await checkCandidateStatus({ token, email })
    return NextResponse.json(status)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    )
  }
}
