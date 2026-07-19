import { hasGradingGuidance } from "@/lib/ai/grade-prompt"
import { librarySkillTags } from "@/lib/question-library/display"
import type { LibraryBundle } from "@/lib/question-library/bundles"
import type { Question } from "@/lib/types"

const RESISTANCE_RANK = { high: 0, medium: 1, low: 2 } as const

function topicKey(q: Question): string {
  const tags = librarySkillTags(q)
  return tags[0] ?? q.prompt.slice(0, 48)
}

function questionScore(q: Question): number {
  let s =
    (2 - (RESISTANCE_RANK[q.ai_resistance ?? "medium"] ?? 1)) * 10
  if (
    hasGradingGuidance({
      expected: q.correct_answer_exact,
      rubric: q.rubric,
      modelAnswer: q.model_answer,
    })
  ) {
    s += 6
  }
  if ((q.test_cases ?? []).some((tc) => tc.expected_output?.trim())) s += 6
  return s
}

function hasGradingAid(q: Question): boolean {
  return (
    hasGradingGuidance({
      expected: q.correct_answer_exact,
      rubric: q.rubric,
      modelAnswer: q.model_answer,
    }) ||
    (q.test_cases ?? []).some((tc) => tc.expected_output?.trim())
  )
}

/**
 * Picks questions for a bundle: high AI-resistance first, topic spread, mixed
 * types, and prefer items with grading aids (exact key, rubric, or test cases).
 */
export function selectQuestionsForBundle(
  bundle: LibraryBundle,
  pool: Question[],
): Question[] {
  const categoryIds = bundle.categories ?? [bundle.category]
  const isMulti = categoryIds.length > 1

  if (isMulti) {
    const perCat = Math.max(1, Math.floor(bundle.questionCount / categoryIds.length))
    const picked: Question[] = []
    for (const catId of categoryIds) {
      const sub = selectFromPool(
        { ...bundle, category: catId, categories: undefined, questionCount: perCat },
        pool,
        picked,
      )
      for (const q of sub) {
        if (!picked.includes(q)) picked.push(q)
      }
    }
    for (const catId of categoryIds) {
      if (picked.length >= bundle.questionCount) break
      const need = bundle.questionCount - picked.length
      const sub = selectFromPool(
        { ...bundle, category: catId, categories: undefined, questionCount: need },
        pool,
        picked,
      )
      for (const q of sub) {
        if (picked.length >= bundle.questionCount) break
        if (!picked.includes(q)) picked.push(q)
      }
    }
    return picked.slice(0, bundle.questionCount)
  }

  return selectFromPool(bundle, pool, [])
}

function selectFromPool(
  bundle: LibraryBundle,
  pool: Question[],
  exclude: Question[],
): Question[] {
  let candidates = pool.filter(
    (q) =>
      !exclude.includes(q) &&
      (q.category_id ?? q.library_category) === bundle.category,
  )
  if (bundle.seniority) {
    const level = candidates.filter((q) => q.seniority === bundle.seniority)
    if (level.length >= bundle.questionCount) candidates = level
  }

  // Drop low-resistance items when enough higher-resistance alternatives exist.
  const withoutLow = candidates.filter((q) => q.ai_resistance !== "low")
  if (withoutLow.length >= bundle.questionCount) candidates = withoutLow

  const sorted = [...candidates].sort(
    (a, b) =>
      questionScore(b) - questionScore(a) ||
      (a.estimated_minutes ?? 99) - (b.estimated_minutes ?? 99),
  )

  const maxPerTopic = Math.max(2, Math.ceil(bundle.questionCount / 4))
  const picked: Question[] = []
  const topicCounts = new Map<string, number>()

  function canTake(q: Question): boolean {
    const t = topicKey(q)
    return (topicCounts.get(t) ?? 0) < maxPerTopic
  }

  function take(q: Question) {
    picked.push(q)
    const t = topicKey(q)
    topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1)
  }

  // Pass 1: one of each type (if available), respecting topic caps.
  for (const type of ["short_answer", "coding", "multiple_choice"] as const) {
    if (picked.length >= bundle.questionCount) break
    const q = sorted.find(
      (c) => c.type === type && !picked.includes(c) && canTake(c),
    )
    if (q) take(q)
  }

  // Pass 2: spread topics, prefer grading aids.
  for (const q of sorted) {
    if (picked.length >= bundle.questionCount) break
    if (picked.includes(q) || !canTake(q)) continue
    if (!hasGradingAid(q) && sorted.some((c) => !picked.includes(c) && hasGradingAid(c) && canTake(c))) {
      continue
    }
    take(q)
  }

  // Pass 3: fill remainder.
  for (const q of sorted) {
    if (picked.length >= bundle.questionCount) break
    if (!picked.includes(q)) take(q)
  }

  return picked.slice(0, bundle.questionCount)
}
