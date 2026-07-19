import type { QuestionSeniority } from "@/lib/types"

/** Bracket tag at the start of ML/MBB seed prompts, if present. */
export function bracketTag(prompt: string): string | null {
  const m = prompt.match(/^\[([^\]]+)\]/)
  return m ? m[1].trim() : null
}

/**
 * Infer seniority from explicit signals in ML / MBB source JSON.
 * Returns null when the level is ambiguous — leave unspecified in the bank.
 */
export function inferSeedSeniority(input: {
  categoryId: string
  prompt: string
  ai_resistance?: string
}): QuestionSeniority | null {
  const tag = bracketTag(input.prompt)
  if (input.categoryId === "machine-learning") {
    if (tag === "Classic ML") return "junior"
    if (tag === "Judgment" || tag === "MLOps") return "senior"
    if (tag) return "mid"
    return null
  }
  if (input.categoryId === "project-program-associate") {
    if (tag === "Business judgment") return "senior"
    if (
      input.ai_resistance === "low" &&
      tag &&
      [
        "Structured problem-solving",
        "Quantitative reasoning",
        "Market sizing & estimation",
        "Excel & data analysis",
      ].includes(tag)
    ) {
      return "junior"
    }
    if (tag) return "mid"
    return null
  }
  return null
}
