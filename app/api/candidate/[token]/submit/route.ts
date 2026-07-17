import { NextResponse } from "next/server"

import { submitAttemptRecord } from "@/lib/db/queries"
import { clientIpFromHeaders } from "@/lib/http/origin"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = (await req.json()) as {
      attemptId: string
      answers: Record<string, string>
      tabSwitchCount: number
      consent?: { version: string; snapshot: string }
    }

    const result = await submitAttemptRecord({
      token,
      attemptId: body.attemptId,
      answers: body.answers,
      tabSwitchCount: body.tabSwitchCount,
      consent: body.consent,
      ipAddress: clientIpFromHeaders(req.headers),
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = (err as Error).message
    const status = message.includes("credits") ? 402 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
