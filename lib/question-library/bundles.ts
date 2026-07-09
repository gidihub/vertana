import type { LibraryCategory, Question } from "@/lib/types"
import { sortLibraryQuestions } from "@/lib/question-library/display"

export type LibraryBundle = {
  id: string
  title: string
  category: LibraryCategory
  description: string
  questionCount: number
  estimatedMinutes: number
}

export const LIBRARY_BUNDLES: LibraryBundle[] = [
  {
    id: "backend-screen",
    title: "Backend screening",
    category: "backend",
    description: "APIs, SQL, concurrency, and system design basics.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "frontend-fundamentals",
    title: "Frontend fundamentals",
    category: "frontend",
    description: "React, performance, accessibility, and UI debugging.",
    questionCount: 10,
    estimatedMinutes: 40,
  },
  {
    id: "data-quick",
    title: "Data analyst quick screen",
    category: "data",
    description: "SQL, statistics, and practical data reasoning.",
    questionCount: 6,
    estimatedMinutes: 25,
  },
  {
    id: "ops-support",
    title: "Ops & support screen",
    category: "ops",
    description: "Incident response, monitoring, and customer-facing triage.",
    questionCount: 6,
    estimatedMinutes: 28,
  },
]

export function questionsForBundle(
  bundle: LibraryBundle,
  pool: Question[],
): Question[] {
  const inCategory = pool.filter((q) => q.library_category === bundle.category)
  return sortLibraryQuestions(inCategory, "recommended").slice(
    0,
    bundle.questionCount,
  )
}
