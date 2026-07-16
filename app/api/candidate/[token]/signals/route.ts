import { NextResponse } from "next/server"
import { z } from "zod"

import { recordAttemptSignals } from "@/lib/db/queries"

/**
 * Credible ceiling for a single "time outside the window" report. One away
 * interval longer than an hour is implausible, so anything larger is clamped
 * to guard against bogus/overflowing client values.
 */
const MAX_OUTSIDE_MS_PER_UPDATE = 60 * 60 * 1000

const bodySchema = z.object({
  attemptId: z.string().uuid(),
  userAgent: z.string().max(2000).optional(),
  dualScreen: z.boolean().optional(),
  fullscreenExit: z.boolean().optional(),
  mouseOut: z.boolean().optional(),
  outsideMs: z.number().int().min(0).optional(),
})

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
    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const body = parsed.data

    await recordAttemptSignals({
      token,
      attemptId: body.attemptId,
      userAgent: body.userAgent ?? null,
      dualScreen: typeof body.dualScreen === "boolean" ? body.dualScreen : null,
      fullscreenExit: body.fullscreenExit === true,
      mouseOut: body.mouseOut === true,
      outsideMs:
        body.outsideMs === undefined
          ? undefined
          : Math.min(body.outsideMs, MAX_OUTSIDE_MS_PER_UPDATE),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Failed to record attempt signals", err)
    return NextResponse.json(
      { error: "Failed to record signals" },
      { status: 500 },
    )
  }
}
