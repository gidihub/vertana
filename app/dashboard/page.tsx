import { RecruiterShell } from "@/components/recruiter-shell"
import { TestList } from "@/components/dashboard/test-list"

export default function Page() {
  return (
    <RecruiterShell
      title="Your assessments"
      subtitle="Create tests, share candidate links, and review results."
    >
      <TestList />
    </RecruiterShell>
  )
}
