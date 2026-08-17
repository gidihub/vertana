import {
  canViewSharedResource,
  canViewTest,
  type PermissionContext,
  type RoleId,
  isLockedRole,
  PermissionDeniedError,
} from "@/lib/auth/permissions"
import type { RecruiterPermissionContext } from "@/lib/auth/permission-context"

export interface ScopedTestRow {
  id: string
  created_by: string | null
}

/** Filter tests to those visible under the user's role + scope settings. */
export function filterTestsForUser<T extends ScopedTestRow>(
  tests: T[],
  ctx: PermissionContext & {
    userId: string
    assignedTestIds: ReadonlySet<string>
  },
): T[] {
  if (ctx.roleId === "billing_manager") return []

  if (isLockedRole(ctx.roleId)) return tests

  return tests.filter((test) =>
    canViewTest(ctx, {
      testId: test.id,
      createdBy: test.created_by,
      userId: ctx.userId,
      assignedTestIds: ctx.assignedTestIds,
    }),
  )
}

export function filterCandidatesForUser<
  T extends { id: string; test_id: string },
>(
  candidates: T[],
  ctx: RecruiterPermissionContext,
  testsById: ReadonlyMap<string, ScopedTestRow>,
): T[] {
  if (ctx.roleId === "billing_manager") return []
  if (isLockedRole(ctx.roleId)) return candidates

  return candidates.filter((candidate) => {
    const test = testsById.get(candidate.test_id)
    if (!test) return false
    if (
      !canViewTest(ctx, {
        testId: test.id,
        createdBy: test.created_by,
        userId: ctx.userId,
        assignedTestIds: ctx.assignedTestIds,
      })
    ) {
      return false
    }
    return canViewSharedResource(ctx, {
      sharedTestIds: ctx.sharedTestIds,
      sharedAttemptIds: ctx.sharedAttemptIds,
      testId: candidate.test_id,
      attemptId: candidate.id,
    })
  })
}

export function canAccessRecruiterSurface(roleId: RoleId): boolean {
  return roleId !== "billing_manager"
}

export function canAccessSharedResource(
  ctx: PermissionContext & {
    sharedTestIds: ReadonlySet<string>
    sharedAttemptIds: ReadonlySet<string>
  },
  input: { testId?: string; attemptId?: string },
): boolean {
  return canViewSharedResource(ctx, {
    sharedTestIds: ctx.sharedTestIds,
    sharedAttemptIds: ctx.sharedAttemptIds,
    testId: input.testId,
    attemptId: input.attemptId,
  })
}

export function assertCanAccessTest(
  ctx: RecruiterPermissionContext,
  test: ScopedTestRow,
): void {
  if (ctx.roleId === "billing_manager") {
    throw new PermissionDeniedError()
  }
  if (
    !canViewTest(ctx, {
      testId: test.id,
      createdBy: test.created_by,
      userId: ctx.userId,
      assignedTestIds: ctx.assignedTestIds,
    })
  ) {
    throw new PermissionDeniedError()
  }
}

export function assertCanAccessAttempt(
  ctx: RecruiterPermissionContext,
  input: { testId: string; attemptId: string; test: ScopedTestRow },
): void {
  assertCanAccessTest(ctx, input.test)
  if (
    !canViewSharedResource(ctx, {
      sharedTestIds: ctx.sharedTestIds,
      sharedAttemptIds: ctx.sharedAttemptIds,
      testId: input.testId,
      attemptId: input.attemptId,
    })
  ) {
    throw new PermissionDeniedError()
  }
}
