import { RecruiterShell } from "@/components/recruiter-shell"
import { TestBuilder } from "@/components/builder/test-builder"

export default function NewTestPage() {
  return (
    <RecruiterShell
      title="Create a new test"
      subtitle="Configure the assessment, then add questions or generate them with AI."
    >
      <TestBuilder />
    </RecruiterShell>
  )
}
