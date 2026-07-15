import { NextResponse } from "next/server"

import { markInviteOpened } from "@/lib/db/queries"

// 1x1 transparent GIF used as an email open beacon.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
)

export const dynamic = "force-dynamic"

// Cap how long open tracking may delay the pixel response.
const TRACKING_TIMEOUT_MS = 1000

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  // Best-effort: never fail or indefinitely delay the pixel, even if the
  // tracking write errors or stalls.
  await Promise.race([
    markInviteOpened(token).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, TRACKING_TIMEOUT_MS)),
  ])

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  })
}
