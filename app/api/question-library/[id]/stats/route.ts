import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { loadLibraryQuestionStats } from "@/lib/db/library-stats"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    const { id } = await params
    const stats = await loadLibraryQuestionStats(id)
    if (!stats) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }
    return NextResponse.json({ stats })
  })
}
