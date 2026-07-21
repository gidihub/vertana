import type { SolvabilityVerdict } from "@/lib/ai/resistance-rubric"

export const QUESTION_MIN_LENGTH = 20
export const QUESTION_MAX_LENGTH = 2000

export const QUESTION_TYPES = [
  "multiple_choice",
  "short_answer",
  "coding",
] as const

export type SolvabilityQuestionType = (typeof QUESTION_TYPES)[number]

export type SolvabilitySuggestion = {
  description: string
  rewrittenQuestion?: string
}

export type SolvabilityResult = {
  id: string
  verdict: SolvabilityVerdict
  verdictLabel: string
  aiResistance: "low" | "medium" | "high"
  modelAttempt: string
  properties: string[]
  suggestions: SolvabilitySuggestion[]
  cached: boolean
  shareToken: string | null
}

export function sharePath(token: string): string {
  return `/tools/ai-solvability-checker/r/${token}`
}
