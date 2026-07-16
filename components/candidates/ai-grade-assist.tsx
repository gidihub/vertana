"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Pencil, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchGradeSuggestion, gradeAttempt } from "@/lib/store"
import { gradeFromScore } from "@/lib/candidates/report"
import { numericText } from "@/lib/design-tokens"

/**
 * Advisory AI grading for a free-text answer. Shows a suggested score + one-line
 * rationale (fetched once and cached server-side), with Accept/Override actions.
 * Only the recruiter's Accept/Override writes the score, via the existing grade
 * write path; the page is then refreshed so the verdict/legend reflect it.
 */
export function AiGradeAssist({
  testId,
  attemptId,
  questionId,
  maxPoints,
  initialScore,
  initialRationale,
}: {
  testId: string
  attemptId: string
  questionId: string
  maxPoints: number
  initialScore: number | null
  initialRationale: string | null
}) {
  const router = useRouter()
  const [score, setScore] = useState<number | null>(initialScore)
  const [rationale, setRationale] = useState<string | null>(initialRationale)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [overriding, setOverriding] = useState(false)
  const [overrideValue, setOverrideValue] = useState(String(initialScore ?? 0))
  const requested = useRef(false)

  useEffect(() => {
    if (score !== null || requested.current) return
    requested.current = true
    setLoading(true)
    fetchGradeSuggestion({ testId, attemptId, questionId })
      .then((res) => {
        setScore(res.suggestedScore)
        setRationale(res.rationale)
        setOverrideValue(String(res.suggestedScore))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [testId, attemptId, questionId, score])

  async function writeGrade(points: number) {
    const grade = gradeFromScore(points, maxPoints)
    setSaving(true)
    try {
      await gradeAttempt({
        testId,
        attemptId,
        grades: [
          {
            questionId,
            isCorrect: grade.isCorrect,
            pointsAwarded: grade.pointsAwarded,
          },
        ],
      })
      toast.success(`Scored ${grade.pointsAwarded}/${maxPoints}`)
      setOverriding(false)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || "Could not save score")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 rounded-md border border-dashed border-border bg-muted/30 p-3 print:hidden">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="size-3.5 text-accent-foreground" />
        AI grading assist
      </div>

      {loading ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Evaluating answer…
        </p>
      ) : error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : score !== null ? (
        <>
          <p className="mt-2 text-sm">
            <span className={`font-semibold ${numericText}`}>
              {score}/{maxPoints}
            </span>{" "}
            suggested
          </p>
          {rationale && (
            <p className="mt-1 text-sm text-muted-foreground">{rationale}</p>
          )}

          {overriding ? (
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={maxPoints}
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                className="h-8 w-20"
              />
              <span className="text-sm text-muted-foreground">/ {maxPoints}</span>
              <Button
                size="sm"
                disabled={saving}
                onClick={() => {
                  const parsed = Number(overrideValue)
                  if (
                    overrideValue.trim() === "" ||
                    !Number.isFinite(parsed) ||
                    parsed < 0 ||
                    parsed > maxPoints
                  ) {
                    toast.error(`Enter a score between 0 and ${maxPoints}`)
                    return
                  }
                  void writeGrade(parsed)
                }}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => setOverriding(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                disabled={saving}
                onClick={() => void writeGrade(score)}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check data-icon="inline-start" />
                )}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setOverrideValue(String(score))
                  setOverriding(true)
                }}
              >
                <Pencil data-icon="inline-start" />
                Override
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
