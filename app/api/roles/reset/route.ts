import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import { type RoleId } from "@/lib/auth/permissions"
import { loadOrgPermissionState, resetRoleToDefault } from "@/lib/db/rbac"

const schema = z.object({
  roleId: z.enum([
    "hiring_manager",
    "recruiter",
    "reviewer",
    "billing_manager",
  ]),
})

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, user, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: z.infer<typeof schema>
    try {
      body = schema.parse(await req.json())
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    await resetRoleToDefault(orgId, body.roleId as RoleId)

    try {
      await auditRecruiterAction({
        orgId,
        userId: user.id,
        action: "roles.preset_reset",
        resourceType: "role",
        resourceId: body.roleId,
      })
    } catch {
      // Non-blocking.
    }

    const state = await loadOrgPermissionState(orgId)
    return NextResponse.json({
      ok: true,
      permissions: state.permissions,
      scopes: state.scopes,
    })
  })
}
