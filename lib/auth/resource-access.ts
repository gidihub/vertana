import { assertCan, type PermissionKey } from "@/lib/auth/permissions"
import {
  loadRecruiterPermissions,
  type RecruiterPermissionContext,
} from "@/lib/auth/permission-context"

export {
  assertCanAccessAttempt,
  assertCanAccessTest,
} from "@/lib/auth/scope-filter"

/** Load permission context and assert a boolean permission key. */
export async function requirePermissionContext(
  permission: PermissionKey,
): Promise<RecruiterPermissionContext> {
  const ctx = await loadRecruiterPermissions()
  assertCan(ctx, permission)
  return ctx
}

/** Billing routes: owner/admin (locked) or billing_manager with settings.billing. */
export async function requireBillingPermission(): Promise<RecruiterPermissionContext> {
  return requirePermissionContext("settings.billing")
}
