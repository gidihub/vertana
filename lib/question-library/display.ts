import { LIBRARY_CATEGORIES } from "@/lib/question-library/seed-data"
import type { AiResistance, LibraryCategory, Question, QuestionType } from "@/lib/types"

export type LibrarySort = "recommended" | "quickest" | "hardest"

export const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "MCQ",
  short_answer: "Short answer",
  coding: "Coding",
}

const TOPIC_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /\breact\b/i, label: "React" },
  { pattern: /\btypescript\b/i, label: "TypeScript" },
  { pattern: /\bsql\b|postgres/i, label: "SQL" },
  { pattern: /\bhttp\b|rest\b|api\b/i, label: "APIs" },
  { pattern: /\bcss\b|layout\b/i, label: "CSS" },
  { pattern: /\baccessib/i, label: "Accessibility" },
  { pattern: /\bqueue\b|kafka\b/i, label: "Messaging" },
  { pattern: /\bpython\b|pandas\b/i, label: "Python" },
  { pattern: /\bmonitor|observability|slo\b/i, label: "Observability" },
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
): "Easy" | "Medium" | "Hard" {
  const minutes = q.estimated_minutes ?? 5
  if (q.type === "coding" && minutes >= 12) return "Hard"
  if (q.ai_resistance === "high" || minutes >= 10) return "Hard"
  if (minutes <= 3 && q.ai_resistance === "low") return "Easy"
  if (minutes <= 5) return "Medium"
  return "Medium"
}

export function libraryTopics(q: Question): string[] {
  const topics: string[] = []
  const cat = LIBRARY_CATEGORIES.find((c) => c.id === q.library_category)
  if (cat) {
    const short = cat.label.split("·").pop()?.trim()
    if (short) topics.push(short)
  }
  for (const { pattern, label } of TOPIC_KEYWORDS) {
    if (pattern.test(q.prompt)) topics.push(label)
  }
  if (q.type === "coding") topics.push("Coding")
  return [...new Set(topics)].slice(0, 4)
}

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return "General"
  return (
    LIBRARY_CATEGORIES.find((c) => c.id === (id as LibraryCategory))?.label ??
    id
  )
}

export function sortLibraryQuestions(
  items: Question[],
  sort: LibrarySort,
): Question[] {
  const copy = [...items]
  if (sort === "quickest") {
    return copy.sort(
      (a, b) => (a.estimated_minutes ?? 99) - (b.estimated_minutes ?? 99),
    )
  }
  if (sort === "hardest") {
    return copy.sort((a, b) => {
      const rank = { Easy: 0, Medium: 1, Hard: 2 }
      return (
        rank[inferredDifficulty(b)] - rank[inferredDifficulty(a)] ||
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

export function countByCategory(items: Question[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const item of items) {
    const cat = item.library_category ?? "other"
    map[cat] = (map[cat] ?? 0) + 1
  }
  return map
}
