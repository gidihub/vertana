import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { replaceLibraryCategory, countLibraryCategory } from "./apply-library-seed.mjs"
import { loadEnv, loadGeneratedCategory, legacySeedCount, questionToRow } from "./library-seed-utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const env = { ...loadEnv(path.join(root, ".env.local")), ...process.env }
const supabase = createClient(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const cat = process.argv[2]
if (!cat) throw new Error("usage: node _replace.mjs <category> [--apply]")
const offset = legacySeedCount(cat)
const generated = loadGeneratedCategory(cat)
const rows = generated.map((q, i) => questionToRow(q, cat, offset + i))

const before = await countLibraryCategory(supabase, cat)
console.log(`[${cat}] before=${before} file=${generated.length} -> order_index ${offset}..${offset + rows.length - 1}`)

if (process.argv.includes("--apply")) {
  await replaceLibraryCategory(supabase, { category: cat, rows })
  const after = await countLibraryCategory(supabase, cat)
  console.log(`[${cat}] after=${after}`)
} else {
  console.log("  dry-run (pass --apply)")
}
