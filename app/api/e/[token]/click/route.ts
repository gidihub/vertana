import { NextResponse } from "next/server"

import { markInviteClicked } from "@/lib/db/queries"
import { appOrigin } from "@/lib/notifications/send-email"

export const dynamic = "force-dynamic"

// Cap how long click tracking may delay the redirect to the assessment.
const TRACKING_TIMEOUT_MS = 1000

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  // Best-effort click tracking, bounded so a slow or failing DB write never
  // indefinitely delays handing the candidate off to the assessment.
  await Promise.race([
    markInviteClicked(token).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, TRACKING_TIMEOUT_MS)),
  ])

  return NextResponse.redirect(`${appOrigin()}/t/${token}`, 302)
}
