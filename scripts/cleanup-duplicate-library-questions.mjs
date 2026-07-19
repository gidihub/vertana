/**
 * Remove duplicate library questions (same normalized prompt within a category).
 *
 * Usage:
 *   node scripts/cleanup-duplicate-library-questions.mjs --dry-run
 *   node scripts/cleanup-duplicate-library-questions.mjs --apply
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

import { loadEnv, normalizePrompt } from "./library-seed-utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

async function main() {
  const apply = process.argv.includes("--apply")

  const env = {
    ...loadEnv(path.join(root, ".env.local")),
    ...process.env,
  }
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing Supabase credentials in .env.local")
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { data: rows, error } = await supabase
    .from("questions")
    .select("id, prompt, category_id, library_category, created_at")
    .eq("is_library_item", true)
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)

  const groups = new Map()
  for (const row of rows ?? []) {
    const cat = row.category_id ?? row.library_category ?? "unknown"
    const key = `${cat}::${normalizePrompt(row.prompt ?? "")}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }

  const toDelete = []
  for (const [, list] of groups) {
    if (list.length < 2) continue
    const { data: answerRefs, error: answerError } = await supabase
      .from("answers")
      .select("question_id")
      .in(
        "question_id",
        list.map((r) => r.id),
      )
    if (answerError) throw new Error(answerError.message)
    const withAnswers = new Set((answerRefs ?? []).map((a) => a.question_id))

    const sorted = [...list].sort((a, b) => {
      const aHas = withAnswers.has(a.id) ? 0 : 1
      const bHas = withAnswers.has(b.id) ? 0 : 1
      if (aHas !== bHas) return aHas - bHas
      return (
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
      )
    })

    const keep = sorted[0]
    for (const dup of sorted.slice(1)) {
      if (withAnswers.has(dup.id)) {
        console.warn(
          `SKIP (has answers): would delete ${dup.id} but candidate answers exist — review manually`,
        )
        continue
      }
      toDelete.push({ id: dup.id, cat: keep.category_id ?? keep.library_category, keep: keep.id })
    }
  }

  console.log(`Duplicate groups: ${[...groups.values()].filter((g) => g.length > 1).length}`)
  console.log(`Rows to delete: ${toDelete.length}`)
  for (const d of toDelete.slice(0, 20)) {
    console.log(`  delete ${d.id} (keep ${d.keep}) [${d.cat}]`)
  }
  if (toDelete.length > 20) console.log(`  …and ${toDelete.length - 20} more`)

  if (!apply) {
    console.log("\nDry run — no rows deleted. Re-run with --apply to delete.")
    return
  }

  if (!toDelete.length) return

  const { error: delError } = await supabase
    .from("questions")
    .delete()
    .in(
      "id",
      toDelete.map((d) => d.id),
    )
  if (delError) throw new Error(delError.message)
  console.log(`Deleted ${toDelete.length} duplicate library question(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
