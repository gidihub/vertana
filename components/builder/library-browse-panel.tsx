"use client"

import type { Question } from "@/lib/types"
import { LibraryWorkspace } from "@/components/library/library-workspace"

export function LibraryBrowsePanel({
  testId,
  onAdd,
}: {
  testId: string
  codingEnabled: boolean
  onAdd: (questions: Question[]) => void
}) {
  return (
    <LibraryWorkspace mode="builder" testId={testId} onAdd={onAdd} />
  )
}
