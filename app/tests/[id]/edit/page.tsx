"use client"

import { use } from "react"
import Link from "next/link"

import { useStore } from "@/lib/store"
import { RecruiterShell } from "@/components/recruiter-shell"
import { TestBuilder } from "@/components/builder/test-builder"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

export default function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const test = useStore((db) => db.tests.find((t) => t.id === id))

  return (
    <RecruiterShell>
      {test ? (
        <TestBuilder existing={test} />
      ) : (
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Test not found</EmptyTitle>
              <EmptyDescription>
                This test may have been deleted or the link is incorrect.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button nativeButton={false} render={<Link href="/dashboard" />}>Back to tests</Button>
            </EmptyContent>
          </Empty>
        </div>
      )}
    </RecruiterShell>
  )
}
