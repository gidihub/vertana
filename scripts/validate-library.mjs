/**
 * Pressure-test the question library: structural validation, DB parity, MCQ answer audit.
 *
 * Usage:
 *   node scripts/validate-library.mjs              # static + DB parity
 *   node scripts/validate-library.mjs --mcq-audit  # + AI MCQ correctness check
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

import { LEGACY_SLUG_BY_CATEGORY, loadEnv, normalizePrompt } from "./library-seed-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const LEAF_CATEGORIES = [
  "frontend-engineering",
  "backend-engineering",
  "data-analyst",
  "machine-learning",
  "project-program-associate",
  "customer-technical-support",
  "devops-cloud",
  "qa-testing",
  "business-financial-analysis",
  "sales-growth-marketing",
  "mobile-engineering",
  "database-administration",
  "ux-design",
  "hr-people-management",
  "ai-governance",
  "remote-collaboration",
  "ai-assisted-work-sample",
  "reading-comprehension",
  "attention-to-detail",
  "following-instructions",
  "applied-numeracy",
  "numerical-reasoning",
  "critical-thinking",
  "problem-solving",
]

const LEGACY_SLUG_TO_ID = Object.fromEntries(
  Object.entries(LEGACY_SLUG_BY_CATEGORY).map(([id, slug]) => [slug, id]),
)

function loadLegacySeed() {
  const path = join(root, "lib/question-library/seed-data.ts")
  if (!existsSync(path)) return []
  const text = readFileSync(path, "utf8")
  const questions = []
  const blockRe =
    /\{[^{}]*category:\s*"([^"]+)"[^{}]*type:\s*"([^"]+)"[^{}]*prompt:\s*(?:"([^"]+)"|'([^']+)')[^{}]*\}/gs
  let m
  while ((m = blockRe.exec(text)) !== null) {
    const categorySlug = m[1]
    const type = m[2]
    const prompt = m[3] ?? m[4]
    const block = m[0]
    const options = [...block.matchAll(/"([^"]+)"/g)]
      .map((x) => x[1])
      .filter((o) => o !== categorySlug && o !== type && o !== prompt)
    const idxMatch = block.match(/correct_option_index:\s*(\d+|null)/)
    const resistanceMatch = block.match(/ai_resistance:\s*"([^"]+)"/)
    const minutesMatch = block.match(/estimated_minutes:\s*(\d+)/)
    questions.push({
      category_id: LEGACY_SLUG_TO_ID[categorySlug] ?? categorySlug,
      type,
      prompt,
      options: type === "multiple_choice" ? options.slice(0, 4) : [],
      correct_option_index:
        idxMatch && idxMatch[1] !== "null" ? Number(idxMatch[1]) : null,
      correct_answer_exact: null,
      test_cases: [],
      ai_resistance: resistanceMatch?.[1] ?? "medium",
      estimated_minutes: minutesMatch ? Number(minutesMatch[1]) : 3,
      source: "legacy-seed",
    })
  }
  return questions
}

function loadAllJsonQuestions() {
  const questions = []

  const generatedDir = join(root, "lib/question-library/generated")
  if (existsSync(generatedDir)) {
    for (const file of readdirSync(generatedDir).filter((f) => f.endsWith(".json"))) {
      const categoryId = file.replace(/\.json$/, "")
      const items = JSON.parse(readFileSync(join(generatedDir, file), "utf8"))
      for (const q of items) {
        questions.push({
          ...q,
          category_id: q.category_id ?? categoryId,
          source: "generated",
        })
      }
    }
  }

  for (const [file, categoryId] of [
    ["ml-seed.json", "machine-learning"],
    ["mbb-seed.json", "project-program-associate"],
  ]) {
    const path = join(root, "lib/question-library", file)
    if (!existsSync(path)) continue
    const items = JSON.parse(readFileSync(path, "utf8"))
    for (const q of items) {
      const legacySlug = q.category
      const mapped =
        legacySlug === "ml"
          ? "machine-learning"
          : legacySlug === "consulting"
            ? "project-program-associate"
            : (q.category_id ?? categoryId)
      questions.push({
        ...q,
        category_id: mapped,
        source: file,
      })
    }
  }

  return questions
}

function isLegacyGeneratedOverlap(a, b) {
  const sources = new Set([a.source, b.source])
  return sources.has("legacy-seed") && sources.has("generated")
}

function validateQuestion(q, index, ctx) {
  const issues = []
  const id = `${ctx.category_id}#${index} (${ctx.source})`

  if (!q.prompt?.trim()) issues.push({ severity: "error", id, msg: "empty prompt" })
  if (!["multiple_choice", "short_answer", "coding"].includes(q.type)) {
    issues.push({ severity: "error", id, msg: `invalid type: ${q.type}` })
  }
  if (!["low", "medium", "high"].includes(q.ai_resistance)) {
    issues.push({ severity: "error", id, msg: `invalid ai_resistance: ${q.ai_resistance}` })
  }
  if (!q.estimated_minutes || q.estimated_minutes < 1 || q.estimated_minutes > 60) {
    issues.push({ severity: "warn", id, msg: `suspicious estimated_minutes: ${q.estimated_minutes}` })
  }
  if (!LEAF_CATEGORIES.includes(q.category_id) && q.category_id !== "ai-assisted-work-sample") {
    issues.push({ severity: "warn", id, msg: `unknown category_id: ${q.category_id}` })
  }

  if (q.type === "multiple_choice") {
    const opts = q.options ?? []
    if (opts.length !== 4) {
      issues.push({ severity: "error", id, msg: `MCQ must have 4 options, has ${opts.length}` })
    }
    if (opts.some((o) => !String(o).trim())) {
      issues.push({ severity: "error", id, msg: "MCQ has empty option" })
    }
    if (q.correct_option_index == null || q.correct_option_index < 0 || q.correct_option_index > 3) {
      issues.push({ severity: "error", id, msg: `invalid correct_option_index: ${q.correct_option_index}` })
    }
    if (q.correct_option_index != null && opts[q.correct_option_index] == null) {
      issues.push({ severity: "error", id, msg: "correct_option_index out of range" })
    }
    if ((q.test_cases ?? []).length > 0) {
      issues.push({ severity: "warn", id, msg: "MCQ has test_cases" })
    }
  }

  if (q.type === "short_answer") {
    if ((q.options ?? []).length > 0) {
      issues.push({ severity: "warn", id, msg: "short_answer has options" })
    }
    if (q.correct_option_index != null) {
      issues.push({ severity: "error", id, msg: "short_answer has correct_option_index" })
    }
    if (!q.correct_answer_exact?.trim()) {
      issues.push({ severity: "info", id, msg: "short_answer manual-grade (no exact key)" })
    }
  }

  if (q.type === "coding") {
    const cases = q.test_cases ?? []
    const snippetStyle =
      /provided snippet|provided code|candidate is given|inline\)/i.test(q.prompt)
    if (cases.length === 0) {
      const manualByDesign =
        snippetStyle ||
        ctx.source === "legacy-seed" ||
        ctx.source === "ml-seed.json" ||
        ctx.source === "mbb-seed.json"
      issues.push({
        severity: manualByDesign ? "warn" : "error",
        id,
        msg: manualByDesign
          ? "coding manual-review (no test_cases — snippet/script style)"
          : "coding question missing test_cases",
      })
    } else {
      if (cases.length < 2) {
        issues.push({ severity: "warn", id, msg: `coding has only ${cases.length} test case(s)` })
      }
      for (const [i, tc] of cases.entries()) {
        if (tc.expected_output == null) {
          issues.push({ severity: "error", id, msg: `test_case[${i}] missing expected_output` })
        }
        if (tc.input == null) {
          issues.push({ severity: "error", id, msg: `test_case[${i}] missing input` })
        }
      }
    }
    if (q.correct_option_index != null) {
      issues.push({ severity: "error", id, msg: "coding has correct_option_index" })
    }
  }

  return issues
}

async function checkDbParity(expectedByCategory) {
  const env = {
    ...loadEnv(join(root, ".env.local")),
    ...process.env,
  }
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { skipped: true, issues: [] }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from("questions")
    .select("library_category, category_id, type, correct_answer, test_cases, prompt, options")
    .eq("is_library_item", true)

  if (error) throw new Error(`DB fetch failed: ${error.message}`)

  const issues = []
  const dbByCategory = {}
  for (const row of data ?? []) {
    const cat = row.category_id ?? row.library_category ?? "unknown"
    dbByCategory[cat] = (dbByCategory[cat] ?? 0) + 1

    const id = `db:${cat}:${row.prompt?.slice(0, 40)}`
    if (row.type === "multiple_choice") {
      const opts = row.options ?? []
      if (opts.length !== 4) {
        issues.push({ severity: "error", id, msg: `DB MCQ has ${opts.length} options` })
      }
      if (!row.correct_answer || row.correct_answer.kind !== "index") {
        issues.push({ severity: "error", id, msg: "DB MCQ missing correct_answer index" })
      } else if (
        row.correct_answer.value < 0 ||
        row.correct_answer.value >= opts.length
      ) {
        issues.push({ severity: "error", id, msg: "DB MCQ correct_answer out of range" })
      }
    }
    if (row.type === "coding" && (!row.test_cases || row.test_cases.length === 0)) {
      const snippetStyle =
        /provided snippet|provided code|candidate is given|inline\)/i.test(row.prompt ?? "")
      issues.push({
        severity: "warn",
        id,
        msg: snippetStyle
          ? "DB coding manual-review (snippet-style)"
          : "DB coding missing test_cases",
      })
    }
  }

  for (const [cat, expected] of Object.entries(expectedByCategory)) {
    const actual = dbByCategory[cat] ?? 0
    if (actual !== expected) {
      issues.push({
        severity: "error",
        id: `db-count:${cat}`,
        msg: `count mismatch: DB=${actual}, expected=${expected}`,
      })
    }
  }

  const dbTotal = data?.length ?? 0
  const expectedTotal = Object.values(expectedByCategory).reduce((a, b) => a + b, 0)
  return { skipped: false, dbTotal, expectedTotal, dbByCategory, issues }
}

const mcqAuditSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      verdict: z.enum(["correct", "incorrect", "ambiguous"]),
      note: z.string(),
    }),
  ),
})

async function auditMcqBatch(batch, modelId) {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const summary = batch
    .map((q, i) => {
      const opts = q.options
        .map((o, j) => `  ${j}. ${o}${j === q.correct_option_index ? " ← MARKED CORRECT" : ""}`)
        .join("\n")
      return `${i}. [${q.category_id}]\n${q.prompt}\n${opts}`
    })
    .join("\n\n")

  const { object } = await generateObject({
    model: openai(modelId),
    schema: mcqAuditSchema,
    prompt: `You are auditing hiring-assessment MCQs. For each question below, judge whether the MARKED CORRECT option is actually the best answer.

Verdicts:
- correct: marked answer is clearly right
- incorrect: a different option is clearly better, or marked answer is wrong
- ambiguous: multiple defensible answers or insufficient context

Be strict on factual/technical questions. Only flag incorrect when confident.

Questions:
${summary}`,
  })

  return object.results
}

function printReport(title, issues) {
  const bySeverity = { error: [], warn: [], info: [] }
  for (const issue of issues) {
    bySeverity[issue.severity]?.push(issue)
  }
  console.log(`\n=== ${title} ===`)
  console.log(`Errors: ${bySeverity.error.length} | Warnings: ${bySeverity.warn.length} | Info: ${bySeverity.info.length}`)
  for (const severity of ["error", "warn"]) {
    for (const issue of bySeverity[severity].slice(0, 30)) {
      console.log(`  [${severity}] ${issue.id}: ${issue.msg}`)
    }
    if (bySeverity[severity].length > 30) {
      console.log(`  … and ${bySeverity[severity].length - 30} more ${severity}s`)
    }
  }
  return bySeverity.error.length
}

async function main() {
  loadEnv(join(root, ".env.local"))
  const mcqAudit = process.argv.includes("--mcq-audit")
  const modelId = process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini"

  const legacy = loadLegacySeed()
  const json = loadAllJsonQuestions()
  const all = [...legacy, ...json]

  console.log(`Loaded ${all.length} questions (${legacy.length} legacy, ${json.length} JSON)`)

  const expectedByCategory = {}
  const staticIssues = []
  const promptHashesByCategory = new Map()
  let legacyGeneratedDupes = 0

  for (const q of all) {
    const cat = q.category_id
    expectedByCategory[cat] = (expectedByCategory[cat] ?? 0) + 1
  }

  for (let i = 0; i < all.length; i++) {
    const q = all[i]
    staticIssues.push(
      ...validateQuestion(q, i, { category_id: q.category_id, source: q.source }),
    )
    const hash = normalizePrompt(q.prompt)
    const catKey = q.category_id ?? "unknown"
    if (!promptHashesByCategory.has(catKey)) {
      promptHashesByCategory.set(catKey, new Map())
    }
    const catHashes = promptHashesByCategory.get(catKey)
    if (catHashes.has(hash)) {
      const prev = catHashes.get(hash)
      if (isLegacyGeneratedOverlap(prev, q)) {
        legacyGeneratedDupes++
      } else {
        staticIssues.push({
          severity: "error",
          id: `${q.category_id}#${i}`,
          msg: `duplicate prompt in ${q.category_id} vs ${prev.id}`,
        })
      }
    } else {
      catHashes.set(hash, { id: `${q.category_id}#${i}`, source: q.source })
    }
  }

  if (legacyGeneratedDupes > 0) {
    console.log(
      `\nNote: ${legacyGeneratedDupes} legacy/generated prompt overlap(s) excluded from duplicate errors (apply script dedupes these).`,
    )
  }

  const effectiveTotal = [...promptHashesByCategory.values()].reduce(
    (n, m) => n + m.size,
    0,
  )
  console.log(`Effective unique prompts (post-dedupe): ${effectiveTotal}`)

  const staticErrors = printReport("Static validation", staticIssues)

  const typeCounts = { multiple_choice: 0, short_answer: 0, coding: 0 }
  const gradable = { mcq: 0, short_exact: 0, coding: 0, manual: 0 }
  for (const q of all) {
    typeCounts[q.type]++
    if (q.type === "multiple_choice" && q.correct_option_index != null) gradable.mcq++
    else if (q.type === "short_answer" && q.correct_answer_exact?.trim()) gradable.short_exact++
    else if (q.type === "coding" && (q.test_cases ?? []).length > 0) gradable.coding++
    else gradable.manual++
  }

  console.log("\n=== Coverage ===")
  console.log("By type:", typeCounts)
  console.log("Auto-gradable:", gradable)
  console.log("By category:", Object.fromEntries(
    LEAF_CATEGORIES.map((c) => [c, expectedByCategory[c] ?? 0]).filter(([, n]) => n > 0),
  ))

  const db = await checkDbParity(expectedByCategory)
  if (db.skipped) {
    console.log("\n=== DB parity: skipped (no Supabase credentials) ===")
  } else {
    printReport("DB parity", db.issues)
    console.log(`DB total: ${db.dbTotal} (expected ${db.expectedTotal})`)
  }

  let mcqErrors = 0
  if (mcqAudit) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY required for --mcq-audit")
      process.exit(1)
    }
    const mcqs = all.filter((q) => q.type === "multiple_choice")
    console.log(`\n=== MCQ audit (${mcqs.length} questions, model: ${modelId}) ===`)
    const batchSize = 8
    const failures = []
    for (let i = 0; i < mcqs.length; i += batchSize) {
      const batch = mcqs.slice(i, i + batchSize)
      process.stdout.write(`  Auditing ${i + 1}-${Math.min(i + batchSize, mcqs.length)}… `)
      const results = await auditMcqBatch(batch, modelId)
      const bad = results.filter((r) => r.verdict !== "correct")
      if (bad.length) {
        for (const r of bad) {
          const q = batch[r.index]
          failures.push({
            severity: r.verdict === "incorrect" ? "error" : "warn",
            id: `${q.category_id}: ${q.prompt.slice(0, 60)}…`,
            msg: `${r.verdict}: ${r.note}`,
          })
        }
        console.log(`${bad.length} flagged`)
      } else {
        console.log("ok")
      }
    }
    mcqErrors = printReport("MCQ answer audit", failures)
  }

  const totalErrors =
    staticIssues.filter((i) => i.severity === "error").length +
    (db.skipped ? 0 : db.issues.filter((i) => i.severity === "error").length) +
    mcqErrors

  console.log(`\n${totalErrors === 0 ? "PASS" : "FAIL"}: ${totalErrors} error(s)`)
  if (!mcqAudit) {
    console.log("Tip: run with --mcq-audit to AI-check all MCQ marked answers")
  }
  process.exit(totalErrors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
