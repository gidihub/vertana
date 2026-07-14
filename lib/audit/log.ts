import { createAdminClient } from "@/lib/supabase/admin"

export type AuditLogInput = {
  orgId?: string | null
  userId?: string | null
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("audit_logs").insert({
    org_id: input.orgId ?? null,
    user_id: input.userId ?? null,
    action: input.action,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    metadata: input.metadata ?? {},
  })

  if (error) {
    console.error("[audit] failed to write log:", error.message)
    throw new Error(`Failed to write audit log: ${error.message}`)
  }
}
