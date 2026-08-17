import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import {
  CONFIGURABLE_ROLES,
  PERMISSION_DOMAINS,
  PERMISSION_KEYS,
  ROLE_DESCRIPTIONS,
  ROLE_IDS,
  ROLE_LABELS,
  canonicalizeRolePermissions,
  type PermissionKey,
  type RoleId,
  isLockedRole,
} from "@/lib/auth/permissions"
import {
  loadOrgPermissionState,
  saveOrgPermissionMatrix,
  saveOrgRolePermissions,
} from "@/lib/db/rbac"

const scopeSchema = z.object({
  assessment_view_scope: z.enum(["all", "assigned"]),
  reviewer_scope: z.enum(["all", "shared"]),
})

const patchSchema = z.object({
  roleId: z.enum([
    "hiring_manager",
    "recruiter",
    "reviewer",
    "billing_manager",
  ]),
  permissions: z.record(z.string(), z.boolean()),
  scopes: scopeSchema,
})

const bulkSchema = z.object({
  permissions: z.record(z.string(), z.record(z.string(), z.boolean())),
  scopes: z.record(z.string(), scopeSchema),
})

function scopePayload(
  roleId: RoleId,
  scopes: z.infer<typeof bulkSchema>["scopes"],
) {
  const row = scopes[roleId]
  if (!row) {
    throw new Error(`Missing scope settings for ${roleId}`)
  }
  return row
}

export async function GET() {
  return handleApiAuth(async ({ orgId, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const state = await loadOrgPermissionState(orgId)
    return NextResponse.json({
      roles: ROLE_IDS.map((id) => ({
        id,
        label: ROLE_LABELS[id],
        description: ROLE_DESCRIPTIONS[id],
        locked: isLockedRole(id),
        configurable: CONFIGURABLE_ROLES.includes(id),
      })),
      domains: PERMISSION_DOMAINS,
      permissions: state.permissions,
      scopes: state.scopes,
    })
  })
}

export async function PUT(req: Request) {
  return handleApiAuth(async ({ orgId, user, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: z.infer<typeof bulkSchema>
    try {
      body = bulkSchema.parse(await req.json())
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    const permissions = {} as Record<RoleId, Record<PermissionKey, boolean>>
    const scopes = {} as Record<
      RoleId,
      z.infer<typeof scopeSchema>
    >

    try {
      for (const roleId of CONFIGURABLE_ROLES) {
        const raw = body.permissions[roleId]
        if (!raw) {
          return NextResponse.json(
            { error: `Missing permissions for ${roleId}` },
            { status: 400 },
          )
        }
        permissions[roleId] = canonicalizeRolePermissions(raw)
        scopes[roleId] = scopePayload(roleId, body.scopes)
      }
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    try {
      await saveOrgPermissionMatrix({ orgId, permissions, scopes })
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      )
    }

    try {
      await auditRecruiterAction({
        orgId,
        userId: user.id,
        action: "roles.permissions_updated",
        resourceType: "role",
        resourceId: "matrix",
        metadata: { permissions, scopes },
      })
    } catch {
      // Non-blocking audit failure.
    }

    const state = await loadOrgPermissionState(orgId)
    return NextResponse.json({
      ok: true,
      permissions: state.permissions,
      scopes: state.scopes,
    })
  })
}

export async function PATCH(req: Request) {
  return handleApiAuth(async ({ orgId, user, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: z.infer<typeof patchSchema>
    try {
      body = patchSchema.parse(await req.json())
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    let permissions: Record<PermissionKey, boolean>
    try {
      permissions = canonicalizeRolePermissions(body.permissions)
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    await saveOrgRolePermissions({
      orgId,
      roleId: body.roleId as RoleId,
      permissions,
      scopes: body.scopes,
    })

    try {
      await auditRecruiterAction({
        orgId,
        userId: user.id,
        action: "roles.permissions_updated",
        resourceType: "role",
        resourceId: body.roleId,
        metadata: {
          permissions,
          scopes: body.scopes,
        },
      })
    } catch {
      // Non-blocking audit failure.
    }

    const state = await loadOrgPermissionState(orgId)
    return NextResponse.json({ ok: true, permissions: state.permissions, scopes: state.scopes })
  })
}
