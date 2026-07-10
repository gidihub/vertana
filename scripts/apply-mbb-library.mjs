import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

import {
  countLibraryCategory,
  replaceLibraryCategory,
} from "./apply-library-seed.mjs"
import { loadEnv, questionToRow } from "./library-seed-utils.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const CATEGORY = "project-program-associate"

async function main() {
  const env = {
    ...loadEnv(path.join(root, ".env.local")),
    ...process.env,
  }

  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }

  const questions = JSON.parse(
    fs.readFileSync(path.join(root, "lib/question-library/mbb-seed.json"), "utf8"),
  )

  if (!Array.isArray(questions) || questions.length !== 100) {
    console.error(`Expected 100 questions in mbb-seed.json, got ${questions?.length}`)
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const rows = questions.map((q, i) => questionToRow(q, CATEGORY, i))

  await replaceLibraryCategory(supabase, { category: CATEGORY, rows })

  const count = await countLibraryCategory(supabase, CATEGORY)
  console.log("MBB consulting library seeded successfully via Supabase API.")
  console.log(`Consulting questions in database: ${count}`)
}

main().catch((err) => {
  console.error("Seed failed:", err.message)
  process.exit(1)
})
