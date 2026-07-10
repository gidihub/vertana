import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

/** @deprecated Legacy slugs — seed-data.ts now uses leaf category ids directly. */
export const LEGACY_SLUG_BY_CATEGORY = {
  "frontend-engineering": "frontend-engineering",
  "backend-engineering": "backend-engineering",
  "data-analyst": "data-analyst",
  "customer-technical-support": "customer-technical-support",
}

export function loadEnv(filePath) {
  const out = {}
  if (!existsSync(filePath)) return out
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
    if (!process.env[key]) process.env[key] = val
  }
  return out
}

export function questionToRow(q, categoryId, orderIndex) {
  let correct_answer = null
  if (q.type === "multiple_choice" && q.correct_option_index != null) {
    correct_answer = { kind: "index", value: q.correct_option_index }
  } else if (q.type === "short_answer" && q.correct_answer_exact) {
    correct_answer = { kind: "exact", value: q.correct_answer_exact }
  }

  return {
    test_id: null,
    type: q.type,
    prompt: q.prompt,
    options: q.options ?? [],
    correct_answer,
    points: q.points ?? (q.type === "coding" ? 3 : 1),
    order_index: orderIndex,
    ai_resistance: q.ai_resistance ?? "medium",
    source: "library",
    is_library_item: true,
    library_category: categoryId,
    category_id: categoryId,
    estimated_minutes: q.estimated_minutes ?? null,
    test_cases: q.type === "coding" ? (q.test_cases ?? []) : [],
  }
}

export function loadGeneratedCategory(categoryId) {
  const path = join(root, "lib/question-library/generated", `${categoryId}.json`)
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, "utf8"))
}

export function legacySeedCount(categoryId) {
  return LEGACY_SLUG_BY_CATEGORY[categoryId] ? 12 : 0
}
