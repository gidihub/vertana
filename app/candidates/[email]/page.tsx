import { RecruiterShell } from "@/components/recruiter-shell"
import { CandidateProfile } from "@/components/candidates/candidate-profile"
import { candidateDisplayName } from "@/lib/candidate-name"

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email: raw } = await params
  const email = decodeURIComponent(raw)

  return (
    <RecruiterShell
      title={candidateDisplayName(email)}
      subtitle="Candidate report across all assessments."
    >
      <CandidateProfile email={email} />
    </RecruiterShell>
  )
}
