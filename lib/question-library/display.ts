import {
  libraryCategoryById,
  libraryCategoryLabel,
  libraryCategoryTree,
} from "@/lib/question-library/categories"
import type { AiResistance, Question, QuestionSource, QuestionType } from "@/lib/types"

export type LibrarySort =
  | "recommended"
  | "quickest"
  | "longest"
  | "easier"
  | "harder"

export type InferredDifficulty = "Easy" | "Medium" | "Hard"

export const TYPE_SHORT_LABELS: Record<QuestionType, string> = {
  multiple_choice: "MCQ",
  short_answer: "Short answer",
  coding: "Coding",
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  coding: "Coding",
}

export const SOURCE_LABELS: Record<QuestionSource, string> = {
  library: "Library",
  custom: "Custom",
  ai_generated: "AI-generated",
}

/** Questions added within this window show a "New" badge in the library. */
export const LIBRARY_NEW_WINDOW_DAYS = 14

export function isLibraryQuestionNew(
  q: Pick<Question, "created_at">,
  windowDays = LIBRARY_NEW_WINDOW_DAYS,
): boolean {
  if (!q.created_at) return false
  const ageMs = Date.now() - new Date(q.created_at).getTime()
  return ageMs >= 0 && ageMs < windowDays * 86_400_000
}

const TOPIC_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /\breact\b/i, label: "React" },
  { pattern: /\btypescript\b/i, label: "TypeScript" },
  { pattern: /\b(?:sql|postgres)\b/i, label: "SQL" },
  { pattern: /\b(?:http|rest|api)\b/i, label: "APIs" },
  { pattern: /\b(?:css|layout)\b/i, label: "CSS" },
  { pattern: /\baccessib/i, label: "Accessibility" },
  { pattern: /\b(?:queue|kafka)\b/i, label: "Messaging" },
  { pattern: /\b(?:python|pandas)\b/i, label: "Python" },
  { pattern: /\b(?:monitor|observability|slo)\b/i, label: "Observability" },
  { pattern: /\b(?:llm|transformer|rag|embedding)\b/i, label: "LLMs" },
  { pattern: /\b(?:lora|fine-?tun\w*|qlora|dpo|rlhf)\b/i, label: "Fine-tuning" },
  { pattern: /\b(?:prompt|few-?shot|injection)\b/i, label: "Prompting" },
  { pattern: /\b(?:docker|kubernetes|container)\b/i, label: "Containers" },
  { pattern: /\b(?:vertex|cloud run|gcp|google cloud)\b/i, label: "Google Cloud" },
  { pattern: /\b(?:vector|pgvector|pinecone|hnsw)\b/i, label: "Vector DB" },
  { pattern: /\b(?:mece|issue tree|hypothesis)\b/i, label: "Problem solving" },
  { pattern: /\b(?:market sizing|estimation)\b/i, label: "Market sizing" },
  { pattern: /\b(?:excel|spreadsheet)\b/i, label: "Excel" },
  { pattern: /\b(?:deck|slide|pyramid principle)\b/i, label: "Communication" },
  { pattern: /\b(?:chart|interpret)\b/i, label: "Data interpretation" },
]

export function libraryTitle(prompt: string): string {
  const trimmed = prompt.trim()
  const first = trimmed.split(/(?<=[.?!])\s+/)[0] ?? trimmed
  if (first.length <= 78) return first
  return `${first.slice(0, 75).trim()}…`
}

export function librarySummary(prompt: string): string {
  const trimmed = prompt.trim()
  const parts = trimmed.split(/(?<=[.?!])\s+/).filter(Boolean)
  if (parts.length > 1) {
    const rest = parts.slice(1).join(" ")
    return rest.length <= 160 ? rest : `${rest.slice(0, 157).trim()}…`
  }
  if (trimmed.length <= 78) return ""
  return trimmed.length <= 160
    ? trimmed
    : `${trimmed.slice(0, 157).trim()}…`
}

export function inferredDifficulty(
  q: Pick<Question, "estimated_minutes" | "ai_resistance" | "type">,
): InferredDifficulty {
  const minutes = q.estimated_minutes ?? 5
  if (q.type === "coding" && minutes >= 12) return "Hard"
  if (q.ai_resistance === "high" || minutes >= 10) return "Hard"
  if (minutes <= 3 && q.ai_resistance === "low") return "Easy"
  if (minutes <= 5) return "Medium"
  return "Medium"
}

export function librarySubcategoryLabel(q: Question): string | null {
  const catId = q.category_id ?? q.library_category
  const cat = catId ? libraryCategoryById(catId) : undefined
  return cat?.name ?? null
}

/** Skill/topic keywords from the prompt — not category or format. */
export function librarySkillTags(q: Question): string[] {
  const tags: string[] = []
  for (const { pattern, label } of TOPIC_KEYWORDS) {
    if (pattern.test(q.prompt)) tags.push(label)
  }
  return [...new Set(tags)].slice(0, 2)
}

/** Tags for library cards: sub-category + skills only (no parent category or format). */
export function libraryTopics(q: Question): string[] {
  const topics: string[] = []
  const subcategory = librarySubcategoryLabel(q)
  if (subcategory) topics.push(subcategory)
  topics.push(...librarySkillTags(q))
  return topics
}

export function categoryLabel(id: string | null | undefined): string {
  return libraryCategoryLabel(id)
}

export function countByCategory(items: Question[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const item of items) {
    const cat = item.category_id ?? item.library_category ?? "other"
    map[cat] = (map[cat] ?? 0) + 1
  }
  return map
}

export function countByCategoryTree(items: Question[]): Record<string, number> {
  const leaf = countByCategory(items)
  const totals: Record<string, number> = { ...leaf }
  for (const parent of libraryCategoryTree()) {
    const childSum = parent.children.reduce(
      (sum, child) => sum + (leaf[child.id] ?? 0),
      0,
    )
    totals[parent.id] = (leaf[parent.id] ?? 0) + childSum
  }
  totals[""] = items.length
  return totals
}

export function sortLibraryQuestions(
  items: Question[],
  sort: LibrarySort,
): Question[] {
  const copy = [...items]
  const difficultyRank: Record<InferredDifficulty, number> = {
    Easy: 0,
    Medium: 1,
    Hard: 2,
  }

  if (sort === "quickest") {
    return copy.sort(
      (a, b) => (a.estimated_minutes ?? 99) - (b.estimated_minutes ?? 99),
    )
  }
  if (sort === "longest") {
    return copy.sort(
      (a, b) => (b.estimated_minutes ?? 0) - (a.estimated_minutes ?? 0),
    )
  }
  if (sort === "easier") {
    return copy.sort(
      (a, b) =>
        difficultyRank[inferredDifficulty(a)] -
          difficultyRank[inferredDifficulty(b)] ||
        (a.estimated_minutes ?? 99) - (b.estimated_minutes ?? 99),
    )
  }
  if (sort === "harder") {
    return copy.sort((a, b) => {
      return (
        difficultyRank[inferredDifficulty(b)] -
          difficultyRank[inferredDifficulty(a)] ||
        (b.estimated_minutes ?? 0) - (a.estimated_minutes ?? 0)
      )
    })
  }
  const resistanceRank: Record<AiResistance, number> = {
    high: 0,
    medium: 1,
    low: 2,
  }
  return copy.sort(
    (a, b) =>
      resistanceRank[a.ai_resistance ?? "medium"] -
        resistanceRank[b.ai_resistance ?? "medium"] ||
      (a.estimated_minutes ?? 99) - (b.estimated_minutes ?? 99),
  )
}

