import { NextResponse } from "next/server"

import { recordAttemptSignals } from "@/lib/db/queries"

/**
 * Credible ceiling for a single "time outside the window" report. One away
 * interval longer than an hour is implausible, so anything larger is clamped
 * to guard against bogus/overflowing client values.
 */
const MAX_OUTSIDE_MS_PER_UPDATE = 60 * 60 * 1000

function normalizeOutsideMs(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return undefined
  }
  return Math.min(value, MAX_OUTSIDE_MS_PER_UPDATE)
}

/**
 * Accumulates proctoring integrity signals for an in-progress attempt
 * (device/user-agent, dual-screen, full-screen exits, mouse-out, time outside
 * the window). Token-gated like the other candidate routes; best-effort, so a
 * failure never disrupts the candidate.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = (await req.json().catch(() => null)) as {
      attemptId?: string
      userAgent?: string
      dualScreen?: boolean
      fullscreenExit?: boolean
      mouseOut?: boolean
      outsideMs?: number
    } | null

    if (!body?.attemptId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    await recordAttemptSignals({
      token,
      attemptId: body.attemptId,
      userAgent: body.userAgent ?? null,
      dualScreen: typeof body.dualScreen === "boolean" ? body.dualScreen : null,
      fullscreenExit: body.fullscreenExit === true,
      mouseOut: body.mouseOut === true,
      outsideMs: normalizeOutsideMs(body.outsideMs),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
