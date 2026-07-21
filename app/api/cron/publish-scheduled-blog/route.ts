import { NextResponse } from "next/server"

import { publishDueScheduledPosts } from "@/lib/cms/publish-scheduled"

/**
 * Publishes blog posts whose scheduled_at is in the past.
 * Secured with CRON_SECRET when set (same pattern as other cron routes).
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const published = await publishDueScheduledPosts()
  return NextResponse.json({ ok: true, published })
}
