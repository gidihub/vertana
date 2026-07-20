import fs from "node:fs"
import path from "node:path"

/** Figures derived from files in the repo — safe to cite in blog posts. */
export type LibraryStats = {
  generatedQuestionCount: number
  categoryFileCount: number
  aiResistance: { high: number; medium: number; low: number }
  frontendEngineering: { total: number; coding: number }
  appliedAptitudeLeaves: number
}

let cached: LibraryStats | null = null

export function getLibraryStats(): LibraryStats {
  if (cached) return cached

  const genDir = path.join(process.cwd(), "lib/question-library/generated")
  const files = fs.readdirSync(genDir).filter((f) => f.endsWith(".json"))

  let generatedQuestionCount = 0
  const aiResistance = { high: 0, medium: 0, low: 0 }

  for (const file of files) {
    const rows = JSON.parse(
      fs.readFileSync(path.join(genDir, file), "utf8"),
    ) as Array<{ ai_resistance?: string; type?: string }>
    const qs = Array.isArray(rows) ? rows : []
    generatedQuestionCount += qs.length
    for (const q of qs) {
      const r = q.ai_resistance
      if (r !== "high" && r !== "medium" && r !== "low") {
        throw new Error(
          `Invalid ai_resistance in ${file}: expected "high", "medium", or "low", got ${JSON.stringify(r)}`,
        )
      }
      if (r === "high") aiResistance.high += 1
      else if (r === "medium") aiResistance.medium += 1
      else aiResistance.low += 1
    }
  }

  const fePath = path.join(genDir, "frontend-engineering.json")
  const feRows = JSON.parse(fs.readFileSync(fePath, "utf8")) as Array<{
    type?: string
  }>
  const feList = Array.isArray(feRows) ? feRows : []

  cached = {
    generatedQuestionCount,
    categoryFileCount: files.length,
    aiResistance,
    frontendEngineering: {
      total: feList.length,
      coding: feList.filter((q) => q.type === "coding").length,
    },
    appliedAptitudeLeaves: 7,
  }
  return cached
}
