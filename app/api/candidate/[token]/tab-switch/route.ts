import { NextResponse } from "next/server"

import { incrementTabSwitch } from "@/lib/db/queries"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const { attemptId } = (await req.json()) as { attemptId: string }
    const count = await incrementTabSwitch({ token, attemptId })
    return NextResponse.json({ tabSwitchCount: count })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
