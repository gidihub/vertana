import { LibraryAdminPanel } from "@/components/library/library-admin-panel"
import { RecruiterShell } from "@/components/recruiter-shell"

export default function LibraryAdminPage() {
  return (
    <RecruiterShell
      title="Library admin"
      subtitle="Grading-gap backlog and bundle coverage across leaf categories."
    >
      <LibraryAdminPanel />
    </RecruiterShell>
  )
}
