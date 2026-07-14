import { writeAuditLog } from "@/lib/audit/log"

export async function auditRecruiterAction(input: {
  orgId: string
  userId: string
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  return writeAuditLog({
    orgId: input.orgId,
    userId: input.userId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata,
  })
}
