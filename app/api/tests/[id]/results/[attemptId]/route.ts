import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { loadAttemptAnswers, updateAttemptGrades } from "@/lib/db/queries"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
) {
  const result = await handleApiAuth(async () => {
    const { id, attemptId } = await params
    const answers = await loadAttemptAnswers(id, attemptId)
    return NextResponse.json({ answers })
  })
  return result
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
) {
  const result = await handleApiAuth(async () => {
    const { id, attemptId } = await params
    const { grades } = (await req.json()) as {
      grades: Array<{
        questionId: string
        isCorrect: boolean | null
        pointsAwarded: number
      }>
    }

    const candidate = await updateAttemptGrades({
      testId: id,
      attemptId,
      grades,
    })
    return NextResponse.json({ candidate })
  })
  return result
}
