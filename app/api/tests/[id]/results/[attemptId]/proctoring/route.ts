import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import {
  loadRecruiterPermissions,
  requirePermission,
} from "@/lib/auth/permission-context"
import {
  assertCanAccessAttempt,
  assertCanAccessTest,
} from "@/lib/auth/scope-filter"
import { loadProctoringMedia, loadTestById } from "@/lib/db/queries"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
) {
  return handleApiAuth(async () => {
    await requirePermission("media.view")
    const permCtx = await loadRecruiterPermissions()
    const { id, attemptId } = await params
    const test = await loadTestById(id)
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }
    const scopedTest = { id: test.id, created_by: test.created_by ?? null }
    assertCanAccessTest(permCtx, scopedTest)
    assertCanAccessAttempt(permCtx, {
      testId: id,
      attemptId,
      test: scopedTest,
    })
    const media = await loadProctoringMedia(id, attemptId)
    return NextResponse.json({ media })
  })
}
