import { NextResponse } from "next/server"

import { loadTestByToken } from "@/lib/db/queries"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const loaded = await loadTestByToken(token)
    if (!loaded) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 })
    }

    return NextResponse.json({
      test: loaded.test,
      inviteId: loaded.invite.id,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
