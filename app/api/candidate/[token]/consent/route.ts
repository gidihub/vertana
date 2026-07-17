import { NextResponse } from "next/server"
import { z } from "zod"

import {
  activeConsentVersion,
  buildConsentSnapshot,
  CONSENT_VERSION_CAMERA,
  CONSENT_VERSION_TAB,
  consentCopyForVersion,
} from "@/lib/consent"
import { recordConsent } from "@/lib/db/queries"
import { clientIpFromHeaders } from "@/lib/http/origin"

const bodySchema = z.object({
  attemptId: z.string().uuid(),
  version: z.enum([CONSENT_VERSION_TAB, CONSENT_VERSION_CAMERA]),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = bodySchema.parse(await req.json())
    if (body.version !== activeConsentVersion()) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const copy = consentCopyForVersion(body.version)
    await recordConsent({
      token,
      attemptId: body.attemptId,
      version: body.version,
      snapshot: buildConsentSnapshot(copy),
      ipAddress: clientIpFromHeaders(req.headers),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to save consent" },
      { status: 500 },
    )
  }
}
