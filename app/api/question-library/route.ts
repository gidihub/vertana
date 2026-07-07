import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { loadLibraryQuestions } from "@/lib/db/library"
import type { AiResistance, LibraryCategory } from "@/lib/types"

export async function GET(req: Request) {
  return handleApiAuth(async () => {
    const url = new URL(req.url)
    const category = url.searchParams.get("category") as LibraryCategory | null
    const search = url.searchParams.get("search") ?? ""
    const ai_resistance = url.searchParams.get(
      "ai_resistance",
    ) as AiResistance | null

    const questions = await loadLibraryQuestions({
      category: category ?? "",
      search,
      ai_resistance: ai_resistance ?? "",
    })

    return NextResponse.json({ questions })
  })
}
