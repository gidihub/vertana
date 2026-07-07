import { rowToQuestion, type QuestionRow } from "@/lib/db/mappers"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AiResistance, LibraryCategory, Question } from "@/lib/types"

export async function loadLibraryQuestions(filters?: {
  category?: LibraryCategory | ""
  search?: string
  ai_resistance?: AiResistance | ""
}): Promise<Question[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from("questions")
    .select("*")
    .eq("is_library_item", true)
    .order("library_category")
    .order("order_index")

  if (filters?.category) {
    query = query.eq("library_category", filters.category)
  }
  if (filters?.ai_resistance) {
    query = query.eq("ai_resistance", filters.ai_resistance)
  }
  if (filters?.search?.trim()) {
    query = query.ilike("prompt", `%${filters.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return ((data ?? []) as QuestionRow[]).map(rowToQuestion)
}
