import { NextResponse } from "next/server"

import { processInviteReminders } from "@/lib/db/queries"

export const dynamic = "force-dynamic"

/**
 * Sends candidate invite reminders:
 *   - 48h after an invite is emailed, if the candidate hasn't started.
 *   - within 24h of the deadline, if the candidate hasn't submitted.
 *
 * Triggered by Vercel Cron (see vercel.json). Requests include an
 * `Authorization: Bearer <CRON_SECRET>` header when CRON_SECRET is set; we
 * enforce it so the endpoint can't be invoked by arbitrary callers.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await processInviteReminders()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}
