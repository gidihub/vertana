"use client"

import { useEffect, useState } from "react"
import { CircleSlash, CalendarX, Lock, Loader2 } from "lucide-react"

import { fetchTestByToken, type ProctoringPolicyView } from "@/lib/store"
import { formatDateTime } from "@/lib/format"
import type { Test } from "@/lib/types"
import { CandidateFlow } from "@/components/candidate/candidate-flow"
import { CandidateMessage } from "@/components/candidate/candidate-message"

function isPastDeadline(deadline: string | null): boolean {
  if (!deadline) return false
  return new Date(deadline).getTime() < Date.now()
}

export default function CandidateTestPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [token, setToken] = useState<string | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [proctoringPolicy, setProctoringPolicy] =
    useState<ProctoringPolicyView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { token: t } = await params
      setToken(t)
      try {
        const loaded = await fetchTestByToken(t)
        setTest(loaded.test)
        setProctoringPolicy(loaded.proctoringPolicy)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [params])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-paper">
        <Loader2 className="size-8 animate-spin text-pine" />
      </div>
    )
  }

  if (error || !test || !token) {
    return (
      <CandidateMessage icon={CircleSlash} title="This link doesn't lead to an assessment">
        The assessment link you opened is invalid or hasn&apos;t been published
        yet. Double-check that you used the full link, and contact the hiring
        team that sent it if it still doesn&apos;t work.
      </CandidateMessage>
    )
  }

  if (test.status === "draft") {
    return (
      <CandidateMessage icon={CircleSlash} title="This link doesn't lead to an assessment">
        The assessment link you opened is invalid or hasn&apos;t been published
        yet. Double-check that you used the full link, and contact the hiring
        team that sent it if it still doesn&apos;t work.
      </CandidateMessage>
    )
  }

  if (test.status === "closed") {
    return (
      <CandidateMessage icon={Lock} title="This assessment is closed">
        The hiring team has stopped accepting responses for{" "}
        <span className="font-medium text-foreground">{test.title}</span>. If
        you were expecting to take it, reach out to the person who invited you.
      </CandidateMessage>
    )
  }

  if (isPastDeadline(test.deadline)) {
    return (
      <CandidateMessage icon={CalendarX} title="This assessment has expired">
        The deadline for{" "}
        <span className="font-medium text-foreground">{test.title}</span> passed
        on{" "}
        <span className="font-medium text-foreground">
          {formatDateTime(test.deadline)}
        </span>
        , so it&apos;s no longer accepting responses. Contact the hiring team if
        you think this is a mistake.
      </CandidateMessage>
    )
  }

  return (
    <CandidateFlow
      test={test}
      token={token}
      proctoringPolicy={proctoringPolicy}
    />
  )
}
