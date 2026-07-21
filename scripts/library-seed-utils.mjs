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

export function normalizePrompt(p) {
  return p
    .toLowerCase()
    .replace(/^\[[^\]]+\]\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:!?]+$/g, "")
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
    rubric: q.rubric?.trim() ? q.rubric.trim() : null,
    model_answer: q.model_answer?.trim() ? q.model_answer.trim() : null,
    seniority: q.seniority ?? null,
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

/** Keep in sync with supabase/migrations/045_applied_aptitude_categories.sql */
export const APPLIED_APTITUDE_CATEGORIES = [
  {
    id: "applied-aptitude",
    name: "Applied Aptitude",
    parent_id: null,
    sort_order: 6,
    priority_tier: 2,
  },
  {
    id: "reading-comprehension",
    name: "Reading Comprehension",
    parent_id: "applied-aptitude",
    sort_order: 1,
    priority_tier: 2,
  },
  {
    id: "attention-to-detail",
    name: "Attention to Detail",
    parent_id: "applied-aptitude",
    sort_order: 2,
    priority_tier: 2,
  },
  {
    id: "following-instructions",
    name: "Following Instructions",
    parent_id: "applied-aptitude",
    sort_order: 3,
    priority_tier: 2,
  },
  {
    id: "applied-numeracy",
    name: "Applied Numeracy",
    parent_id: "applied-aptitude",
    sort_order: 4,
    priority_tier: 2,
  },
  {
    id: "numerical-reasoning",
    name: "Numerical Reasoning",
    parent_id: "applied-aptitude",
    sort_order: 5,
    priority_tier: 2,
  },
  {
    id: "critical-thinking",
    name: "Critical Thinking",
    parent_id: "applied-aptitude",
    sort_order: 6,
    priority_tier: 2,
  },
  {
    id: "problem-solving",
    name: "Problem Solving",
    parent_id: "applied-aptitude",
    sort_order: 7,
    priority_tier: 2,
  },
]

const APPLIED_APTITUDE_LEAF_IDS = new Set(
  APPLIED_APTITUDE_CATEGORIES.filter((c) => c.parent_id).map((c) => c.id),
)

export async function ensureLibraryCategoriesForApply(supabase, categoryIds) {
  const needsAppliedAptitude = categoryIds.some(
    (id) => id === "applied-aptitude" || APPLIED_APTITUDE_LEAF_IDS.has(id),
  )
  if (!needsAppliedAptitude) return

  const { error } = await supabase
    .from("library_categories")
    .upsert(APPLIED_APTITUDE_CATEGORIES, { onConflict: "id" })

  if (error) {
    throw new Error(`Applied Aptitude category upsert failed: ${error.message}`)
  }

  console.log(
    `Ensured ${APPLIED_APTITUDE_CATEGORIES.length} Applied Aptitude categories in library_categories`,
  )
}
