import { rowToQuestion, type QuestionRow } from "@/lib/db/mappers"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  LIBRARY_CATEGORIES,
  libraryFilterCategoryIds,
  libraryFilterCategoryValues,
  type LibraryCategoryRecord,
} from "@/lib/question-library/categories"
import type { AiResistance, Question } from "@/lib/types"

export async function loadLibraryCategories(): Promise<
  LibraryCategoryRecord[]
> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("library_categories")
    .select("id, name, parent_id, sort_order, priority_tier")
    .order("sort_order")

  if (error || !data?.length) {
    return LIBRARY_CATEGORIES
  }
  return data as LibraryCategoryRecord[]
}

export async function loadLibraryQuestions(filters?: {
  category?: string | ""
  search?: string
  ai_resistance?: AiResistance | ""
}): Promise<Question[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from("questions")
    .select("*")
    .eq("is_library_item", true)
    .order("order_index")

  const categoryValues = libraryFilterCategoryValues(filters?.category ?? "")
  const categoryIds = libraryFilterCategoryIds(filters?.category ?? "")

  if (categoryValues?.length) {
    // Prefer category_id when migration 013+ is applied; fall back to library_category.
    query = query.or(
      [
        categoryIds?.length
          ? `category_id.in.(${categoryIds.join(",")})`
          : null,
        `library_category.in.(${categoryValues.join(",")})`,
      ]
        .filter(Boolean)
        .join(","),
    )
  }
  if (filters?.ai_resistance) {
    query = query.eq("ai_resistance", filters.ai_resistance)
  }
  if (filters?.search?.trim()) {
    query = query.ilike("prompt", `%${filters.search.trim()}%`)
  }

  let { data, error } = await query

  if (
    error?.message?.includes("category_id") &&
    categoryValues?.length
  ) {
    let fallback = supabase
      .from("questions")
      .select("*")
      .eq("is_library_item", true)
      .order("order_index")
      .in("library_category", categoryValues)
    if (filters?.ai_resistance) {
      fallback = fallback.eq("ai_resistance", filters.ai_resistance)
    }
    if (filters?.search?.trim()) {
      fallback = fallback.ilike("prompt", `%${filters.search.trim()}%`)
    }
    const retry = await fallback
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)
  return ((data ?? []) as QuestionRow[]).map(rowToQuestion)
}
