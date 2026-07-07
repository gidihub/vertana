"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"

import { fetchTestById, useStore } from "@/lib/store"
import { RecruiterShell } from "@/components/recruiter-shell"
import { TestBuilder } from "@/components/builder/test-builder"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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
  const cached = useStore((db) => db.tests.find((t) => t.id === id))
  const [test, setTest] = useState(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    void fetchTestById(id)
      .then((loaded) => setTest(loaded ?? undefined))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <RecruiterShell>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : test ? (
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
              <Button nativeButton={false} render={<Link href="/dashboard" />}>
                Back to tests
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )}
    </RecruiterShell>
  )
}
