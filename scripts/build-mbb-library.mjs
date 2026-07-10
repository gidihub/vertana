import { execSync } from "node:child_process"
import { writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const xlsxPath = process.argv[2] || process.env.MBB_XLSX_PATH

if (!xlsxPath) {
  console.error(
    "Missing Excel path. Pass as the first argument or set MBB_XLSX_PATH.",
  )
  process.exit(1)
}

if (!existsSync(xlsxPath)) {
  console.error(`Excel file not found: ${xlsxPath}`)
  process.exit(1)
}

const importScript = join(root, "scripts/import-mbb-xlsx.py")
const jsonOut = execSync(`python3 ${JSON.stringify(importScript)} ${JSON.stringify(xlsxPath)}`, {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
})

const questions = JSON.parse(jsonOut)
if (questions.length !== 100) {
  console.error(`Expected 100 questions, got ${questions.length}`)
  process.exit(1)
}

const jsonPath = join(root, "lib/question-library/mbb-seed.json")
writeFileSync(jsonPath, JSON.stringify(questions, null, 2) + "\n")

function escSql(str) {
  return str.replace(/'/g, "''")
}

function toCorrectAnswer(q) {
  if (q.correct_option_index != null) {
    return `'{"kind":"index","value":${q.correct_option_index}}'::jsonb`
  }
  return "null"
}

const baseOrder = 148 // after original 48 + ML 100
const lines = [
  "-- MBB project associate question bank (100 items, category: consulting)",
  "delete from questions where is_library_item = true and library_category = 'project-program-associate';",
  "",
]

questions.forEach((q, i) => {
  const options = JSON.stringify(q.options).replace(/'/g, "''")
  const points = q.points ?? 1
  lines.push(
    `insert into questions (test_id, type, prompt, options, correct_answer, points, order_index, ai_resistance, source, is_library_item, library_category, category_id, estimated_minutes) values (null, '${q.type}', '${escSql(q.prompt)}', '${options}'::jsonb, ${toCorrectAnswer(q)}, ${points}, ${baseOrder + i}, '${q.ai_resistance}', 'library', true, 'project-program-associate', 'project-program-associate', ${q.estimated_minutes});`,
  )
})

const sqlPath = join(root, "supabase/migrations/012_seed_mbb_library.sql")
writeFileSync(sqlPath, lines.join("\n") + "\n")

console.log(`Wrote ${questions.length} questions to:`)
console.log(`  ${jsonPath}`)
console.log(`  ${sqlPath}`)
