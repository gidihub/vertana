import { NextResponse } from "next/server"

import { loadTeamInvitePreview } from "@/lib/db/team"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const preview = await loadTeamInvitePreview(token)
  if (!preview) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  }
  return NextResponse.json({ invite: preview })
}
