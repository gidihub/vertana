"use client"

import { use, useEffect, useState } from "react"
import { CircleSlash, CalendarX, Lock, CircleCheck } from "lucide-react"

import { useStore } from "@/lib/store"
import { getSubmittedAt } from "@/lib/attempt"
import { formatDateTime } from "@/lib/format"
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
  const { token } = use(params)
  const test = useStore((db) => db.tests.find((t) => t.token === token))

  // A completed attempt from this browser takes precedence over everything
  // else, so returning to a finished link never looks like a retake.
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  useEffect(() => {
    setSubmittedAt(getSubmittedAt(token))
  }, [token])

  if (submittedAt) {
    return (
      <CandidateMessage
        icon={CircleCheck}
        tone="positive"
        title="Your assessment is already recorded"
      >
        This link has already been completed from this device on{" "}
        <span className="font-medium text-foreground">
          {formatDateTime(submittedAt)}
        </span>
        . There&apos;s nothing more to do — the hiring team has your responses
        and will follow up with next steps. You can close this window.
      </CandidateMessage>
    )
  }

  // No test matches this token: the link is malformed or points at something
  // that no longer exists. A draft test isn't live yet, so it reads the same.
  if (!test || test.status === "draft") {
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

  return <CandidateFlow test={test} />
}
