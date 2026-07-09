import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import {
  deleteTestRecord,
  loadCandidatesForTest,
  loadTestById,
  saveTestRecord,
  setTestPinnedRecord,
  setTestStatusRecord,
} from "@/lib/db/queries"
import type { Test, TestStatus } from "@/lib/types"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    const { id } = await params
    const test = await loadTestById(id)
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }
    const candidates = await loadCandidatesForTest(id)
    return NextResponse.json({ test, candidates })
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async (ctx) => {
    try {
      const { id } = await params
      const test = (await req.json()) as Test
      if (test.id !== id) {
        return NextResponse.json({ error: "ID mismatch" }, { status: 400 })
      }
      const saved = await saveTestRecord(test, {
        creatorEmail: ctx.user.email,
        creatorUserId: ctx.user.id,
      })
      return NextResponse.json({ test: saved })
    } catch (err) {
      const message = (err as Error).message
      const status =
        message.includes("credits") || message.includes("plan") ? 402 : 500
      return NextResponse.json({ error: message }, { status })
    }
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    const { id } = await params
    const body = (await req.json()) as {
      status?: TestStatus
      is_pinned?: boolean
    }

    if (body.status) {
      await setTestStatusRecord(id, body.status)
    }
    if (typeof body.is_pinned === "boolean") {
      await setTestPinnedRecord(id, body.is_pinned)
    }

    const test = await loadTestById(id)
    return NextResponse.json({ test })
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    const { id } = await params
    await deleteTestRecord(id)
    return NextResponse.json({ ok: true })
  })
}
