import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import {
  loadRecruiterPermissions,
  requirePermission,
} from "@/lib/auth/permission-context"
import { assertCanAccessAttempt, assertCanAccessTest } from "@/lib/auth/scope-filter"
import {
  deleteTestRecord,
  loadCandidatesForTest,
  loadTestById,
  saveTestRecord,
  setTestPinnedRecord,
  setTestStatusRecord,
} from "@/lib/db/queries"
import type { Test, TestStatus } from "@/lib/types"

function scopedTest(test: Test) {
  return { id: test.id, created_by: test.created_by ?? null }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async () => {
    const permCtx = await loadRecruiterPermissions()
    const { id } = await params
    const test = await loadTestById(id)
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }
    assertCanAccessTest(permCtx, scopedTest(test))
    const allCandidates = await loadCandidatesForTest(id)
    const candidates = allCandidates.filter((candidate) => {
      try {
        assertCanAccessAttempt(permCtx, {
          testId: id,
          attemptId: candidate.id,
          test: scopedTest(test),
        })
        return true
      } catch {
        return false
      }
    })
    return NextResponse.json({ test, candidates })
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async (ctx) => {
    const permCtx = await requirePermission("tests.edit")
    const { id } = await params
    const existing = await loadTestById(id)
    if (!existing) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }
    assertCanAccessTest(permCtx, scopedTest(existing))

    try {
      const test = (await req.json()) as Test
      if (test.id !== id) {
        return NextResponse.json({ error: "ID mismatch" }, { status: 400 })
      }
      const saved = await saveTestRecord(test, {
        creatorEmail: ctx.user.email,
        creatorUserId: ctx.user.id,
      })
      try {
        await auditRecruiterAction({
          orgId: ctx.orgId,
          userId: ctx.user.id,
          action: "test.updated",
          resourceType: "test",
          resourceId: saved.id,
          metadata: { title: saved.title, status: saved.status },
        })
      } catch {
        // Audit failure is logged in writeAuditLog; don't block test update.
      }
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
  return handleApiAuth(async (ctx) => {
    const { id } = await params
    const existing = await loadTestById(id)
    if (!existing) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    const body = (await req.json()) as {
      status?: TestStatus
      is_pinned?: boolean
    }

    const validStatuses: TestStatus[] = ["draft", "active", "closed"]
    const hasStatusUpdate =
      body.status !== undefined && validStatuses.includes(body.status)
    const hasPinUpdate = typeof body.is_pinned === "boolean"

    if (body.status !== undefined && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (!hasStatusUpdate && !hasPinUpdate) {
      return NextResponse.json(
        { error: "Provide status or is_pinned to update" },
        { status: 400 },
      )
    }

    if (hasStatusUpdate && body.status) {
      const permCtx =
        body.status === "closed"
          ? await requirePermission("assessments.archive")
          : await requirePermission("assessments.edit")
      assertCanAccessTest(permCtx, scopedTest(existing))
      await setTestStatusRecord(id, body.status)
      try {
        await auditRecruiterAction({
          orgId: ctx.orgId,
          userId: ctx.user.id,
          action: "test.status_changed",
          resourceType: "test",
          resourceId: id,
          metadata: { status: body.status },
        })
      } catch {
        // Audit failure is logged in writeAuditLog.
      }
    }
    if (hasPinUpdate) {
      const permCtx = await requirePermission("assessments.edit")
      assertCanAccessTest(permCtx, scopedTest(existing))
      await setTestPinnedRecord(id, body.is_pinned)
      try {
        await auditRecruiterAction({
          orgId: ctx.orgId,
          userId: ctx.user.id,
          action: "test.pin_changed",
          resourceType: "test",
          resourceId: id,
          metadata: { is_pinned: body.is_pinned },
        })
      } catch {
        // Audit failure is logged in writeAuditLog.
      }
    }

    const test = await loadTestById(id)
    return NextResponse.json({ test })
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiAuth(async (ctx) => {
    const permCtx = await requirePermission("tests.delete")
    const { id } = await params
    const existing = await loadTestById(id)
    if (!existing) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }
    assertCanAccessTest(permCtx, scopedTest(existing))

    await deleteTestRecord(id)
    try {
      await auditRecruiterAction({
        orgId: ctx.orgId,
        userId: ctx.user.id,
        action: "test.deleted",
        resourceType: "test",
        resourceId: id,
      })
    } catch {
      // Audit failure is logged in writeAuditLog.
    }
    return NextResponse.json({ ok: true })
  })
}
