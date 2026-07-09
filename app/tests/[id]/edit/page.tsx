"use client"

import { use, useEffect, useState } from "react"

import { fetchTestById, useStore } from "@/lib/store"
import { RecruiterShell } from "@/components/recruiter-shell"
import { TestWorkspaceNav } from "@/components/recruiter/test-workspace-nav"
import { TestBuilder } from "@/components/builder/test-builder"
import { Loader2 } from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const cached = useStore((db) => db.tests.find((t) => t.id === id))
  const [test, setTest] = useState(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    void fetchTestById(id)
      .then((loaded) => setTest(loaded ?? undefined))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <RecruiterShell title="Edit test">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </RecruiterShell>
    )
  }

  if (!test) {
    return (
      <RecruiterShell title="Test not found">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Test not found</EmptyTitle>
            <EmptyDescription>
              This test may have been deleted or the link is incorrect.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Back to dashboard
            </Button>
          </EmptyContent>
        </Empty>
      </RecruiterShell>
    )
  }

  return (
    <RecruiterShell title={test.title} subtitle="Edit test">
      <TestWorkspaceNav testId={test.id} />
      <TestBuilder existing={test} />
    </RecruiterShell>
  )
}
