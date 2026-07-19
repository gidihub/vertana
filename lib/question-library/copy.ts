import type { Question } from "@/lib/types"
import { uid } from "@/lib/store"

export function libraryCopy(
  q: Question,
  testId: string,
  position: number,
): Question {
  return {
    id: uid(),
    test_id: testId,
    type: q.type,
    prompt: q.prompt,
    options: [...q.options],
    correct_option_index: q.correct_option_index,
    correct_answer_exact: q.correct_answer_exact ?? null,
    position,
    points: q.points ?? (q.type === "coding" ? 3 : 1),
    ai_resistance: q.ai_resistance ?? "medium",
    source: "library",
    library_category: q.library_category,
    category_id: q.category_id ?? q.library_category ?? null,
    estimated_minutes: q.estimated_minutes,
    difficulty: q.difficulty,
    rubric: q.rubric ?? null,
    model_answer: q.model_answer ?? null,
    seniority: q.seniority ?? null,
    test_cases: q.test_cases?.length ? [...q.test_cases] : undefined,
  }
}
