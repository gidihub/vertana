import { GlobalCandidatesTable } from "@/components/candidates/global-candidates-table"
import { RecruiterShell } from "@/components/recruiter-shell"

export default function CandidatesPage() {
  return (
    <RecruiterShell
      title="Candidates"
      subtitle="Every candidate across your assessments in one searchable list."
    >
      <GlobalCandidatesTable />
    </RecruiterShell>
  )
}
