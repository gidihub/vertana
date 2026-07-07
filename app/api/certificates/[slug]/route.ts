import { NextResponse } from "next/server"

import { loadCertificateBySlug, revokeCertificateRecord } from "@/lib/db/queries"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const certificate = await loadCertificateBySlug(slug)
    if (!certificate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ certificate })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { email } = (await req.json()) as { email: string }

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 })
    }

    await revokeCertificateRecord({ slug, email })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 403 },
    )
  }
}
