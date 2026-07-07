"use client"

import { use } from "react"

import { RecruiterShell } from "@/components/recruiter-shell"
import { ResultsDashboard } from "@/components/results/results-dashboard"

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <RecruiterShell>
      <ResultsDashboard testId={id} />
    </RecruiterShell>
  )
}
