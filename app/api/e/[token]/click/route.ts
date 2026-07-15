import { NextResponse } from "next/server"

import { markInviteClicked } from "@/lib/db/queries"
import { appOrigin } from "@/lib/notifications/send-email"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  // Best-effort click tracking, then hand the candidate off to the assessment.
  try {
    await markInviteClicked(token)
  } catch {
    // ignore
  }

  return NextResponse.redirect(`${appOrigin()}/t/${token}`, 302)
}
