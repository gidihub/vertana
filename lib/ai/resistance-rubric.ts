/**
 * Canonical ai_resistance rubric — shared by library tagging, question generation,
 * and the public AI-solvability checker so labels stay aligned.
 */
export const AI_RESISTANCE_LEVELS = ["low", "medium", "high"] as const

export const AI_RESISTANCE_RUBRIC = `Rate ai_resistance (low | medium | high) for hiring assessment questions:

- low: generic definitional MCQ or recall question a chatbot could answer from general knowledge alone, without live assessment context
- medium: role-specific scenarios, applied reasoning, partial context, or multi-step thinking — harder than recall but still solvable without proprietary artifacts
- high: debugging with supplied snippets, multi-step judgment over concrete artifacts, proprietary or live context, constrained coding with specific test cases, or prompts where a generic essay scores poorly on the rubric`

export const AI_RESISTANCE_SELF_RATING_HINT =
  "Rate how easily a chatbot could answer without seeing the live assessment context. Generic definitional MCQs = low. Role-specific scenarios, debugging with provided snippets, or multi-step reasoning = medium/high."

export const SOLVABILITY_VERDICTS = [
  "solved_outright",
  "mostly_solved",
  "partially_solved",
  "resists_ai",
] as const

export type SolvabilityVerdict = (typeof SOLVABILITY_VERDICTS)[number]

export const SOLVABILITY_VERDICT_LABELS: Record<SolvabilityVerdict, string> = {
  solved_outright: "Solved outright",
  mostly_solved: "Mostly solved",
  partially_solved: "Partially solved",
  resists_ai: "Resists AI",
}

/** Map public solvability verdicts to internal ai_resistance tags. */
export function verdictToAiResistance(
  verdict: SolvabilityVerdict,
): "low" | "medium" | "high" {
  switch (verdict) {
    case "solved_outright":
    case "mostly_solved":
      return "low"
    case "partially_solved":
      return "medium"
    case "resists_ai":
      return "high"
  }
}
