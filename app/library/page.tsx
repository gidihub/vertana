import { LibraryList } from "@/components/library/library-list"
import { RecruiterShell } from "@/components/recruiter-shell"

export default function LibraryPage() {
  return (
    <RecruiterShell
      title="Question library"
      subtitle="Browse, preview, and add seeded assessment questions to your tests."
    >
      <LibraryList />
    </RecruiterShell>
  )
}
