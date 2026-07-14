import { NextResponse } from "next/server"
import { z } from "zod"

import { recordProctoringMedia } from "@/lib/db/queries"
import { isCameraProctoringEnabled } from "@/lib/proctoring/config"

const bodySchema = z.object({
  attemptId: z.string().uuid(),
  kind: z.enum(["camera", "screen", "face_match"]),
  imageDataUrl: z.string().startsWith("data:image/"),
})

function parseDataUrl(dataUrl: string): { mime: string; bytes: Buffer } {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl)
  if (!match) throw new Error("Invalid image payload")
  return {
    mime: match[1],
    bytes: Buffer.from(match[2], "base64"),
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!isCameraProctoringEnabled()) {
    return NextResponse.json(
      { error: "Camera proctoring is not enabled" },
      { status: 503 },
    )
  }

  try {
    const { token } = await params

    const declaredLength = Number.parseInt(
      req.headers.get("content-length") ?? "",
      10,
    )
    if (Number.isFinite(declaredLength) && declaredLength > 2_500_000) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 })
    }

    const body = bodySchema.parse(await req.json())
    const { mime, bytes } = parseDataUrl(body.imageDataUrl)

    if (bytes.length > 2_500_000) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 })
    }

    const ext = mime.includes("png") ? "png" : "jpg"
    const storagePath = await recordProctoringMedia({
      token,
      attemptId: body.attemptId,
      kind: body.kind,
      bytes,
      contentType: mime,
      extension: ext,
    })

    return NextResponse.json({ ok: true, storagePath })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    if (err instanceof Error && err.message === "Invalid image payload") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    console.error("[proctoring] upload failed:", err)
    return NextResponse.json(
      { error: "Failed to store proctoring media" },
      { status: 500 },
    )
  }
}
