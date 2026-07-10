import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { loadLibraryCategories, loadLibraryQuestions } from "@/lib/db/library"
import type { AiResistance } from "@/lib/types"

export async function GET(req: Request) {
  return handleApiAuth(async () => {
    const url = new URL(req.url)
    const category = url.searchParams.get("category") ?? ""
    const search = url.searchParams.get("search") ?? ""
    const ai_resistance = url.searchParams.get(
      "ai_resistance",
    ) as AiResistance | null
    const includeMeta = url.searchParams.get("meta") === "1"

    const questions = await loadLibraryQuestions({
      category,
      search,
      ai_resistance: ai_resistance ?? "",
    })

    if (!includeMeta) {
      return NextResponse.json({ questions })
    }

    const categories = await loadLibraryCategories()
    return NextResponse.json({ questions, categories })
  })
}
