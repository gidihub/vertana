import { NextResponse } from "next/server"

import { issueCertificateRecord } from "@/lib/db/queries"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const { attemptId, candidateName } = (await req.json()) as {
      attemptId: string
      candidateName: string
    }

    const result = await issueCertificateRecord({
      token,
      attemptId,
      candidateName,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = (err as Error).message
    const status = message.includes("Starter") ? 402 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
