import { cache } from "react"

import {
  type PermissionContext,
  type PermissionKey,
  ROLE_IDS,
  PermissionDeniedError,
  type RoleId,
  assertCan,
  can,
} from "@/lib/auth/permissions"
import {
  ensureOrgRbacSeeded,
  loadAssignedTestIds,
  loadOrgPermissionState,
  loadReviewerShareIds,
} from "@/lib/db/rbac"
import { requireRecruiter } from "@/lib/auth/recruiter"

export interface RecruiterPermissionContext extends PermissionContext {
  orgId: string
  userId: string
  assignedTestIds: Set<string>
  sharedTestIds: Set<string>
  sharedAttemptIds: Set<string>
}

function parseRoleId(role: string): RoleId {
  if (!(ROLE_IDS as readonly string[]).includes(role)) {
    throw new PermissionDeniedError("Invalid organization role")
  }
  return role as RoleId
}

export const loadRecruiterPermissions = cache(
  async (): Promise<RecruiterPermissionContext> => {
    const { orgId, user, role } = await requireRecruiter()
    await ensureOrgRbacSeeded(orgId)

    const roleId = parseRoleId(role)
    const [state, assignedTestIds, shares] = await Promise.all([
      loadOrgPermissionState(orgId),
      loadAssignedTestIds(orgId, user.id),
      loadReviewerShareIds(orgId, user.id),
    ])

    const permissions = state.permissions[roleId]
    const scopes = state.scopes[roleId]
    if (!permissions || !scopes) {
      throw new PermissionDeniedError("Invalid organization role")
    }

    return {
      orgId,
      userId: user.id,
      roleId,
      permissions,
      scopes,
      assignedTestIds,
      sharedTestIds: shares.testIds,
      sharedAttemptIds: shares.attemptIds,
    }
  },
)

export async function requirePermission(
  permission: PermissionKey,
): Promise<RecruiterPermissionContext> {
  const ctx = await loadRecruiterPermissions()
  assertCan(ctx, permission)
  return ctx
}

export { can, assertCan }
