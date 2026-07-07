import { NextResponse } from "next/server"

import { loadAttemptForResume } from "@/lib/db/queries"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const url = new URL(req.url)
    const attemptId = url.searchParams.get("attemptId")?.trim()
    const email = url.searchParams.get("email")?.trim()

    if (!attemptId || !email) {
      return NextResponse.json(
        { error: "attemptId and email required" },
        { status: 400 },
      )
    }

    const attempt = await loadAttemptForResume({ token, attemptId, email })
    return NextResponse.json(attempt)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    )
  }
}
