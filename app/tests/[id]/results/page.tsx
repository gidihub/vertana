"use client"

import { use, useEffect, useState } from "react"

import { fetchTestById, useStore } from "@/lib/store"
import { RecruiterShell } from "@/components/recruiter-shell"
import { TestWorkspaceNav } from "@/components/recruiter/test-workspace-nav"
import { ResultsDashboard } from "@/components/results/results-dashboard"

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const cached = useStore((db) => db.tests.find((t) => t.id === id))
  const [title, setTitle] = useState(cached?.title ?? "Results")

  useEffect(() => {
    if (cached?.title) {
      setTitle(cached.title)
      return
    }
    void fetchTestById(id).then((test) => {
      if (test?.title) setTitle(test.title)
    })
  }, [cached?.title, id])

  return (
    <RecruiterShell title={title} subtitle="Results & candidate activity">
      <TestWorkspaceNav testId={id} />
      <ResultsDashboard testId={id} embedded />
    </RecruiterShell>
  )
}
