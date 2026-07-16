import { RecruiterShell } from "@/components/recruiter-shell"
import { CandidateReport } from "@/components/candidates/candidate-report"
import { candidateDisplayName } from "@/lib/candidate-name"
import { loadCandidateProfile } from "@/lib/db/queries"
import { getOrganization } from "@/lib/org"
import { resolveIntegrityThreshold } from "@/lib/integrity"
import { proctoringPolicyForTier } from "@/lib/proctoring/config"
import type { PlanTier } from "@/lib/plans"

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email: raw } = await params
  const email = decodeURIComponent(raw)

  const [profile, org] = await Promise.all([
    loadCandidateProfile(email),
    getOrganization(),
  ])

  const tier: PlanTier = org.is_comp
    ? "custom"
    : ((org.plan_tier as PlanTier) ?? "starter")
  const policy = proctoringPolicyForTier(tier)
  const configured = org.data_retention_days ?? null
  const retentionDays =
    configured != null
      ? Math.min(configured, policy.maxRetentionDays)
      : policy.defaultRetentionDays

  return (
    <RecruiterShell
      title={candidateDisplayName(email)}
      subtitle="Candidate report across all assessments."
    >
      <CandidateReport
        email={email}
        profile={profile}
        retentionDays={retentionDays}
        tabSwitchThreshold={resolveIntegrityThreshold(org.tab_switch_threshold)}
      />
    </RecruiterShell>
  )
}
