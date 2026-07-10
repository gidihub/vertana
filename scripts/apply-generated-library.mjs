/**
 * Append AI-generated library questions from lib/question-library/generated/.
 * Idempotent: skips rows already present based on current DB count vs legacy+generated total.
 *
 * Usage:
 *   node scripts/apply-generated-library.mjs frontend-engineering
 *   node scripts/apply-generated-library.mjs --tier1
 *   node scripts/apply-generated-library.mjs --tier2
 *   node scripts/apply-generated-library.mjs --tier3
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

import {
  appendLibraryCategory,
  countLibraryCategory,
} from "./apply-library-seed.mjs"
import {
  legacySeedCount,
  loadEnv,
  loadGeneratedCategory,
  questionToRow,
} from "./library-seed-utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

const TIER1_EXPANDED = [
  "frontend-engineering",
  "backend-engineering",
  "data-analyst",
]

const TIER2_EXPANDED = [
  "devops-cloud",
  "qa-testing",
  "business-financial-analysis",
  "customer-technical-support",
  "sales-growth-marketing",
]

const TIER3_EXPANDED = [
  "mobile-engineering",
  "database-administration",
  "ux-design",
  "hr-people-management",
  "ai-governance",
  "remote-collaboration",
]

async function applyCategory(supabase, categoryId) {
  const generated = loadGeneratedCategory(categoryId)
  if (!generated.length) {
    console.log(`Skip ${categoryId}: no generated JSON`)
    return
  }

  const legacy = legacySeedCount(categoryId)
  const targetTotal = legacy + generated.length
  const current = (await countLibraryCategory(supabase, categoryId)) ?? 0

  if (current >= targetTotal) {
    console.log(
      `${categoryId}: already ${current}/${targetTotal} — nothing to append`,
    )
    return
  }

  const alreadyAppended = Math.max(0, current - legacy)
  const toAppend = generated.slice(alreadyAppended)
  if (!toAppend.length) {
    console.log(`${categoryId}: ${current} rows, legacy=${legacy}, nothing new`)
    return
  }

  const rows = toAppend.map((q, i) =>
    questionToRow(q, categoryId, legacy + alreadyAppended + i),
  )

  console.log(
    `${categoryId}: appending ${rows.length} (${current} → ${current + rows.length}, target ${targetTotal})`,
  )
  await appendLibraryCategory(supabase, {
    category: categoryId,
    rows,
    startOrder: legacy + alreadyAppended,
  })

  const after = await countLibraryCategory(supabase, categoryId)
  console.log(`${categoryId}: done — ${after} questions in database`)
}

async function main() {
  const env = {
    ...loadEnv(path.join(root, ".env.local")),
    ...process.env,
  }

  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const categories = args.includes("--tier1")
    ? TIER1_EXPANDED
    : args.includes("--tier2")
      ? TIER2_EXPANDED
      : args.includes("--tier3")
        ? TIER3_EXPANDED
        : args.length
          ? args
          : TIER1_EXPANDED

  const supabase = createClient(url, key)

  for (const categoryId of categories) {
    await applyCategory(supabase, categoryId)
  }
}

main().catch((err) => {
  console.error("Apply failed:", err.message)
  process.exit(1)
})
