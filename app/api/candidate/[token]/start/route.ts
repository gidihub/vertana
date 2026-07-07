import { NextResponse } from "next/server"

import { startAttempt } from "@/lib/db/queries"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const { email } = (await req.json()) as { email: string }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const result = await startAttempt({ token, email: email.trim() })
    return NextResponse.json(result)
  } catch (err) {
    const message = (err as Error).message
    const status =
      message.includes("credits") || message.includes("already completed")
        ? 402
        : 400
    return NextResponse.json({ error: message }, { status })
  }
}
