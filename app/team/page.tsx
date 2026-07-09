"use client"

import { TeamPanel } from "@/components/team/team-panel"
import { RecruiterShell } from "@/components/recruiter-shell"

export default function TeamPage() {
  return (
    <RecruiterShell
      title="Team"
      subtitle="Manage who has access to your organization's assessments."
    >
      <TeamPanel />
    </RecruiterShell>
  )
}
