import type { Question } from "@/lib/types"

export function questionDuplicateKey(
  q: Pick<Question, "type" | "prompt">,
): string | null {
  const normalized = q.prompt.trim().replace(/\s+/g, " ")
  if (!normalized) return null
  return `${q.type}::${normalized}`
}

export function filterNewQuestions(
  existing: Question[],
  incoming: Question[],
): { accepted: Question[]; skipped: number } {
  const existingKeys = new Set(
    existing.map(questionDuplicateKey).filter((key): key is string => key !== null),
  )
  const accepted: Question[] = []
  let skipped = 0

  for (const q of incoming) {
    const key = questionDuplicateKey(q)
    if (key && existingKeys.has(key)) {
      skipped++
      continue
    }
    if (key) existingKeys.add(key)
    accepted.push(q)
  }

  return { accepted, skipped }
}

export function duplicateQuestionsError(
  questions: Pick<Question, "type" | "prompt">[],
): string | null {
  const seen = new Set<string>()
  for (const q of questions) {
    const key = questionDuplicateKey(q)
    if (!key) continue
    if (seen.has(key)) {
      return "This test contains duplicate questions with the same type and prompt."
    }
    seen.add(key)
  }
  return null
}
