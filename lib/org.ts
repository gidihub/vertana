import { requireRecruiter } from "@/lib/auth/recruiter"
import { createAdminClient } from "@/lib/supabase/admin"
import type { OrganizationRow } from "@/lib/db/mappers"

export async function getOrgId(): Promise<string> {
  const { orgId } = await requireRecruiter()
  return orgId
}

export async function getOrganization(): Promise<OrganizationRow> {
  const { orgId } = await requireRecruiter()
  return getOrganizationById(orgId)
}

export async function getOrganizationById(orgId: string): Promise<OrganizationRow> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single()

  if (error || !data) {
    throw new Error(`Organization not found: ${error?.message}`)
  }

  return data as OrganizationRow
}

export async function ensureMonthlyResets(org: OrganizationRow): Promise<OrganizationRow> {
  return ensureMonthlyResetsForOrgId(org.id)
}

export async function ensureMonthlyResetsForOrgId(
  orgId: string,
): Promise<OrganizationRow> {
  const org = await getOrganizationById(orgId)
  const now = Date.now()
  const needsCreditReset = new Date(org.credits_reset_at).getTime() <= now
  const needsAiReset = new Date(org.ai_generations_reset_at).getTime() <= now
  const needsCodeReset = new Date(org.code_executions_reset_at).getTime() <= now

  if (!needsCreditReset && !needsAiReset && !needsCodeReset) return org

  const admin = createAdminClient()
  await admin.rpc("reset_monthly_credits")
  return getOrganizationById(orgId)
}

export async function recordCodeExecutions(
  orgId: string,
  count = 1,
): Promise<void> {
  if (count <= 0) return
  await ensureMonthlyResetsForOrgId(orgId)
  const admin = createAdminClient()
  const { error } = await admin.rpc("increment_code_executions", {
    org_id_input: orgId,
    count_input: count,
  })
  if (error) throw new Error(error.message)
}

export async function deductCredit(orgId: string): Promise<void> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("deduct_candidate_credit", {
    org_id_input: orgId,
  })
  if (error) throw new Error(error.message)
  if (data === false) {
    throw new Error("No candidate credits remaining")
  }
}
