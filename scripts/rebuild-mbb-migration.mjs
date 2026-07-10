/**
 * Regenerate 012_seed_mbb_library.sql from lib/question-library/mbb-seed.json
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const CATEGORY = "project-program-associate"
const BASE_ORDER = 148

function escSql(str) {
  return str.replace(/'/g, "''")
}

function toCorrectAnswer(q) {
  if (q.correct_option_index != null) {
    return `'{"kind":"index","value":${q.correct_option_index}}'::jsonb`
  }
  return "null"
}

const questions = JSON.parse(
  readFileSync(join(root, "lib/question-library/mbb-seed.json"), "utf8"),
)

if (questions.length !== 100) {
  console.error(`Expected 100 questions, got ${questions.length}`)
  process.exit(1)
}

const lines = [
  `-- MBB project associate question bank (100 items, category: ${CATEGORY})`,
  `delete from questions where is_library_item = true and library_category = '${CATEGORY}';`,
  "",
]

questions.forEach((q, i) => {
  const options = JSON.stringify(q.options).replace(/'/g, "''")
  const points = q.points ?? 1
  lines.push(
    `insert into questions (test_id, type, prompt, options, correct_answer, points, order_index, ai_resistance, source, is_library_item, library_category, category_id, estimated_minutes) values (null, '${q.type}', '${escSql(q.prompt)}', '${options}'::jsonb, ${toCorrectAnswer(q)}, ${points}, ${BASE_ORDER + i}, '${q.ai_resistance}', 'library', true, '${CATEGORY}', '${CATEGORY}', ${q.estimated_minutes});`,
  )
})

const sqlPath = join(root, "supabase/migrations/012_seed_mbb_library.sql")
writeFileSync(sqlPath, lines.join("\n") + "\n")
console.log(`Wrote ${questions.length} questions to ${sqlPath}`)
