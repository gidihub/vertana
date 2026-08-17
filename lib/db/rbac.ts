import { createAdminClient } from "@/lib/supabase/admin"
import {
  CONFIGURABLE_ROLES,
  DEFAULT_ROLE_SCOPES,
  PERMISSION_KEYS,
  ROLE_IDS,
  type OrgPermissionState,
  type OrgRolePermissions,
  type PermissionKey,
  type RoleId,
  type RoleScopeSettings,
  defaultPermissionsForRole,
  isLockedRole,
} from "@/lib/auth/permissions"

function rowToPermissions(
  rows: Array<{ permission_key: string; enabled: boolean }>,
  roleId: RoleId,
): OrgRolePermissions {
  const base = defaultPermissionsForRole(roleId)
  for (const row of rows) {
    const key = row.permission_key as PermissionKey
    if ((PERMISSION_KEYS as readonly string[]).includes(key)) {
      base[key] = row.enabled
    }
  }
  return base
}

export async function loadOrgPermissionState(
  orgId: string,
): Promise<OrgPermissionState> {
  const admin = createAdminClient()

  const [
    { data: permRows, error: permError },
    { data: scopeRows, error: scopeError },
  ] = await Promise.all([
    admin
      .from("org_role_permissions")
      .select("role_id, permission_key, enabled")
      .eq("org_id", orgId),
    admin
      .from("org_role_settings")
      .select("role_id, assessment_view_scope, reviewer_scope")
      .eq("org_id", orgId),
  ])

  if (permError) throw new Error(permError.message)
  if (scopeError) throw new Error(scopeError.message)

  const permissions = {} as Record<RoleId, OrgRolePermissions>
  const scopes = {} as Record<RoleId, RoleScopeSettings>

  for (const roleId of ROLE_IDS) {
    if (isLockedRole(roleId)) {
      permissions[roleId] = Object.fromEntries(
        PERMISSION_KEYS.map((k) => [k, true]),
      ) as OrgRolePermissions
      scopes[roleId] = DEFAULT_ROLE_SCOPES[roleId]
      continue
    }

    const roleRows =
      permRows?.filter((r) => r.role_id === roleId) ?? []
    permissions[roleId] =
      roleRows.length > 0
        ? rowToPermissions(roleRows, roleId)
        : defaultPermissionsForRole(roleId)

    const scopeRow = scopeRows?.find((r) => r.role_id === roleId)
    scopes[roleId] = scopeRow
      ? {
          assessment_view_scope: scopeRow.assessment_view_scope as
            | "all"
            | "assigned",
          reviewer_scope: scopeRow.reviewer_scope as "all" | "shared",
        }
      : DEFAULT_ROLE_SCOPES[roleId]
  }

  return { permissions, scopes }
}

export async function saveOrgRolePermissions(input: {
  orgId: string
  roleId: RoleId
  permissions: OrgRolePermissions
  scopes: RoleScopeSettings
}): Promise<void> {
  if (isLockedRole(input.roleId)) {
    throw new Error("Cannot modify locked role permissions")
  }

  const admin = createAdminClient()
  const rows = PERMISSION_KEYS.map((key) => ({
    org_id: input.orgId,
    role_id: input.roleId,
    permission_key: key,
    enabled: input.permissions[key],
  }))

  const { error: permError } = await admin
    .from("org_role_permissions")
    .upsert(rows, { onConflict: "org_id,role_id,permission_key" })

  if (permError) throw new Error(permError.message)

  const { error: scopeError } = await admin.from("org_role_settings").upsert(
    {
      org_id: input.orgId,
      role_id: input.roleId,
      assessment_view_scope: input.scopes.assessment_view_scope,
      reviewer_scope: input.scopes.reviewer_scope,
    },
    { onConflict: "org_id,role_id" },
  )

  if (scopeError) throw new Error(scopeError.message)
}

export async function saveOrgPermissionMatrix(input: {
  orgId: string
  permissions: Record<RoleId, OrgRolePermissions>
  scopes: Record<RoleId, RoleScopeSettings>
}): Promise<void> {
  for (const roleId of CONFIGURABLE_ROLES) {
    await saveOrgRolePermissions({
      orgId: input.orgId,
      roleId,
      permissions: input.permissions[roleId],
      scopes: input.scopes[roleId],
    })
  }
}

export async function resetRoleToDefault(
  orgId: string,
  roleId: RoleId,
): Promise<void> {
  if (!CONFIGURABLE_ROLES.includes(roleId)) {
    throw new Error("Cannot reset a locked role")
  }

  await saveOrgRolePermissions({
    orgId,
    roleId,
    permissions: defaultPermissionsForRole(roleId),
    scopes: DEFAULT_ROLE_SCOPES[roleId],
  })
}

export async function loadAssignedTestIds(
  orgId: string,
  userId: string,
): Promise<Set<string>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("test_assignments")
    .select("test_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((r) => r.test_id as string))
}

export async function loadReviewerShareIds(
  orgId: string,
  userId: string,
): Promise<{ testIds: Set<string>; attemptIds: Set<string> }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("reviewer_shares")
    .select("test_id, attempt_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)

  if (error) throw new Error(error.message)

  const testIds = new Set<string>()
  const attemptIds = new Set<string>()
  for (const row of data ?? []) {
    if (row.test_id) testIds.add(row.test_id as string)
    if (row.attempt_id) attemptIds.add(row.attempt_id as string)
  }
  return { testIds, attemptIds }
}

export async function ensureOrgRbacSeeded(orgId: string): Promise<void> {
  const admin = createAdminClient()
  const { count } = await admin
    .from("org_role_permissions")
    .select("permission_key", { count: "exact", head: true })
    .eq("org_id", orgId)
    .limit(1)

  if ((count ?? 0) > 0) return

  const { error } = await admin.rpc("seed_org_rbac_defaults", {
    p_org_id: orgId,
  })
  if (error) throw new Error(error.message)
}
