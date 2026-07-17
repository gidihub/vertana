import { NextResponse } from "next/server"

import { processAtsDeliveryJobs } from "@/lib/integrations/dispatch"

export const dynamic = "force-dynamic"

/**
 * Drains the ATS outbound delivery queue: sends due jobs to their provider
 * adapter, retrying transient failures with backoff.
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
    const result = await processAtsDeliveryJobs()
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
