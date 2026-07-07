import { NextResponse } from "next/server"

import { saveAnswer } from "@/lib/db/queries"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const { attemptId, questionId, response } = (await req.json()) as {
      attemptId: string
      questionId: string
      response: string
    }

    await saveAnswer({ token, attemptId, questionId, response })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
