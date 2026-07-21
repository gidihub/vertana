/**
 * Generate library question batches (bulk prompts + ai_resistance rating).
 * Uses OPENAI_MODEL (default: gpt-5.4-mini) for both steps.
 *
 * Usage:
 *   node scripts/generate-library-batch.mjs frontend-engineering 25
 *   node scripts/generate-library-batch.mjs frontend-engineering 25 --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createOpenAI } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

function loadEnv() {
  const path = join(root, ".env.local")
  if (!existsSync(path)) return
  for (const line of readFileSync(path, "utf8").split("\n")) {
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
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

const modelId = process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini"
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

const CATEGORY_BRIEFS = {
  "frontend-engineering": {
    name: "Frontend Engineering",
    focus:
      "React, TypeScript, CSS, accessibility, performance (Core Web Vitals), browser APIs, state management, testing UI behavior. Mix MCQ, short answer, and coding with stdin/stdout test cases.",
    codingRatio: 0.25,
  },
  "backend-engineering": {
    name: "Backend Engineering",
    focus:
      "APIs, databases, concurrency, distributed systems, auth, caching, queues, observability. Mix MCQ, short answer, and coding (SQL, algorithms, debugging).",
    codingRatio: 0.3,
  },
  "data-analyst": {
    name: "Data Analyst / Data Science",
    focus:
      "SQL, statistics, experimentation, dashboards, data quality, dbt/warehouse patterns. Mix MCQ, short answer, and SQL/coding exercises.",
    codingRatio: 0.25,
  },
  "devops-cloud": {
    name: "DevOps & Cloud",
    focus:
      "CI/CD, containers, Kubernetes, IaC (Terraform), cloud networking, observability, incident response, SRE practices. Mix MCQ, short answer, and shell/YAML/config debugging.",
    codingRatio: 0.2,
  },
  "qa-testing": {
    name: "QA & Testing",
    focus:
      "Test strategy, automation frameworks, API/UI testing, flaky tests, regression, accessibility testing, release quality gates. Mix MCQ, short answer, and test-design scenarios.",
    codingRatio: 0.2,
  },
  "business-financial-analysis": {
    name: "Business & Financial Analysis",
    focus:
      "Financial modeling, unit economics, forecasting, variance analysis, KPI trees, board-ready narratives, Excel/spreadsheet reasoning. Mostly MCQ and short answer with realistic business scenarios.",
    codingRatio: 0.05,
  },
  "customer-technical-support": {
    name: "Customer & Technical Support",
    focus:
      "Triage, escalation, SLA handling, root-cause communication, ticketing workflows, customer empathy with technical accuracy, knowledge base quality. Mix MCQ and short answer role-play scenarios.",
    codingRatio: 0.05,
  },
  "sales-growth-marketing": {
    name: "Sales & Growth Marketing",
    focus:
      "Pipeline qualification, discovery, objection handling, funnel metrics, positioning, campaign analysis, PLG motions. Mix MCQ and short answer with realistic GTM scenarios.",
    codingRatio: 0.05,
  },
  "mobile-engineering": {
    name: "Mobile Engineering",
    focus:
      "iOS/Android native and cross-platform (React Native, Flutter), app lifecycle, offline/sync, push notifications, performance, accessibility on mobile, app store constraints, mobile CI. Mix MCQ, short answer, and coding (algorithms, Swift/Kotlin-style logic via stdin/stdout).",
    codingRatio: 0.25,
  },
  "database-administration": {
    name: "Database Administration",
    focus:
      "PostgreSQL/MySQL administration, indexing, query plans, replication, backups, HA, security, capacity planning, migration safety. Mix MCQ, short answer, and SQL tuning exercises.",
    codingRatio: 0.2,
  },
  "ux-design": {
    name: "UX & Design",
    focus:
      "User research, information architecture, wireframing, usability heuristics, design systems, accessibility (WCAG), critique of flows, stakeholder communication. Mostly MCQ and short answer with realistic product scenarios; minimal coding.",
    codingRatio: 0.05,
  },
  "hr-people-management": {
    name: "HR & People Management",
    focus:
      "Hiring process design, performance management, conflict resolution, compensation basics, DEI, remote team culture, policy application, difficult conversations. MCQ and short answer with realistic people-leadership scenarios.",
    codingRatio: 0.0,
  },
  "ai-governance": {
    name: "AI Governance & Responsible Use",
    focus:
      "LLM risk, data privacy, bias/fairness, human-in-the-loop, acceptable use policies, vendor evaluation, audit trails, EU AI Act / regulatory awareness, prompt/data handling in enterprises. MCQ and short answer with 2025–2026 enterprise AI scenarios.",
    codingRatio: 0.05,
  },
  "remote-collaboration": {
    name: "Remote Collaboration & Async Communication",
    focus:
      "Async-first workflows, written communication, meeting hygiene, timezone coordination, documentation culture, remote onboarding, feedback across distributed teams. MCQ and short answer with realistic remote-work scenarios.",
    codingRatio: 0.0,
  },
}

const questionSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["multiple_choice", "short_answer", "coding"]),
      prompt: z.string(),
      options: z.array(z.string()),
      correct_option_index: z.number().nullable(),
      correct_answer_exact: z.string().nullable(),
      test_cases: z.array(
        z.object({ input: z.string(), expected_output: z.string() }),
      ),
      estimated_minutes: z.number(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      points: z.number().nullable(),
    }),
  ),
})

const ratingSchema = z.object({
  ratings: z.array(
    z.object({
      index: z.number(),
      ai_resistance: z.enum(["low", "medium", "high"]),
      rationale: z.string(),
    }),
  ),
})

function seedPath(categoryId) {
  return join(root, "lib/question-library/generated", `${categoryId}.json`)
}

function loadLegacySeedPrompts(categoryId) {
  const legacyMap = {
    "frontend-engineering": "frontend-engineering",
    "backend-engineering": "backend-engineering",
    "data-analyst": "data-analyst",
    "customer-technical-support": "customer-technical-support",
  }
  const legacy = legacyMap[categoryId]
  if (!legacy) return []
  const seedPath = join(root, "lib/question-library/seed-data.ts")
  if (!existsSync(seedPath)) return []
  const text = readFileSync(seedPath, "utf8")
  const prompts = []
  const re = new RegExp(
    `category:\\s*"${legacy}"[\\s\\S]*?prompt:\\s*(?:"([^"]+)"|'([^']+)')`,
    "g",
  )
  let m
  while ((m = re.exec(text)) !== null) {
    prompts.push({ prompt: m[1] ?? m[2] })
  }
  return prompts
}

function loadExisting(categoryId) {
  const path = seedPath(categoryId)
  const generated = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : []
  return [...loadLegacySeedPrompts(categoryId), ...generated]
}

async function generateBatch(categoryId, count, existing) {
  const brief = CATEGORY_BRIEFS[categoryId]
  if (!brief) throw new Error(`No brief for category: ${categoryId}`)

  const existingPrompts = existing
    .slice(-40)
    .map((q) => q.prompt.slice(0, 120))
    .join("\n- ")

  const { object } = await generateObject({
    model: openai(modelId),
    schema: questionSchema,
    prompt: `Generate ${count} hiring assessment questions for "${brief.name}".

Focus: ${brief.focus}

Requirements:
- Each prompt must be specific and scenario-based — not generic trivia or definitional fluff.
- No duplicate or near-duplicate prompts. Avoid templates like "(Q2)" or "(variant 2)".
- MCQ: exactly 4 options, correct_option_index 0-3, options empty for non-MCQ.
- Short answer: include correct_answer_exact as a concise sample answer for manual grading.
- Coding: include 2-4 test_cases with realistic stdin/stdout; programs read stdin, write stdout.
- Target ~${Math.round(brief.codingRatio * 100)}% coding questions in this batch.
- estimated_minutes: 2-15 realistic per question type.
- difficulty: vary easy/medium/hard across the batch.
- Do NOT include ai_resistance — that will be rated separately.

Already in library (do not repeat themes):
- ${existingPrompts || "(none yet)"}`,
  })

  return object.questions
}

async function rateResistance(questions) {
  const summary = questions
    .map(
      (q, i) =>
        `${i}. [${q.type}] ${q.prompt.slice(0, 400)}${q.options?.length ? ` | options: ${q.options.length}` : ""}`,
    )
    .join("\n")

  const { object } = await generateObject({
    model: openai(modelId),
    schema: ratingSchema,
    prompt: `Rate ai_resistance (low|medium|high) for each hiring assessment question below.

Guidelines (same rubric as lib/ai/resistance-rubric.ts):
- low: generic definitional MCQ a chatbot could answer from general knowledge alone, without live assessment context
- medium: role-specific scenarios, applied reasoning, partial context, or multi-step thinking — harder than recall but still solvable without proprietary artifacts
- high: debugging with supplied snippets, multi-step judgment over concrete artifacts, proprietary or live context, constrained coding with specific test cases, or prompts where a generic essay scores poorly on the rubric

Make real distinctions — do NOT default everything to medium. Spread ratings across the batch.

Questions:
${summary}`,
  })

  const byIndex = new Map(
    object.ratings.map((r) => [r.index, r.ai_resistance]),
  )
  return questions.map((q, i) => ({
    ...q,
    ai_resistance: byIndex.get(i) ?? "medium",
  }))
}

function normalizeQuestion(q, categoryId) {
  return {
    category: categoryId,
    category_id: categoryId,
    type: q.type,
    prompt: q.prompt.trim(),
    options: q.type === "multiple_choice" ? q.options.slice(0, 4) : [],
    correct_option_index:
      q.type === "multiple_choice" ? (q.correct_option_index ?? 0) : null,
    correct_answer_exact:
      q.type === "short_answer" ? (q.correct_answer_exact ?? null) : null,
    test_cases: q.type === "coding" ? (q.test_cases ?? []).slice(0, 4) : [],
    ai_resistance: q.ai_resistance,
    estimated_minutes: q.estimated_minutes,
    difficulty: q.difficulty,
    points: q.points ?? (q.type === "coding" ? 3 : 1),
  }
}

async function main() {
  const categoryId = process.argv[2]
  const count = Number(process.argv[3] || 25)
  const dryRun = process.argv.includes("--dry-run")

  if (!categoryId) {
    console.error(
      "Usage: node scripts/generate-library-batch.mjs <category-id> [count] [--dry-run]",
    )
    process.exit(1)
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required in .env.local")
    process.exit(1)
  }

  const existing = loadExisting(categoryId)
  const legacyCount = loadLegacySeedPrompts(categoryId).length
  const generatedCount = existing.length - legacyCount
  console.log(
    `Category: ${categoryId} | legacy seed: ${legacyCount} | generated: ${generatedCount} | batch: ${count}`,
  )
  console.log(`Model: ${modelId}`)

  const raw = await generateBatch(categoryId, count, existing)
  const rated = await rateResistance(raw)
  const normalized = rated.map((q) => normalizeQuestion(q, categoryId))

  const resistanceDist = normalized.reduce((acc, q) => {
    acc[q.ai_resistance] = (acc[q.ai_resistance] ?? 0) + 1
    return acc
  }, {})
  console.log("ai_resistance distribution:", resistanceDist)

  console.log("\n--- Sample questions (first 4) ---")
  for (const q of normalized.slice(0, 4)) {
    console.log(`\n[${q.type}] (${q.ai_resistance}, ${q.estimated_minutes}m)`)
    console.log(q.prompt.slice(0, 200) + (q.prompt.length > 200 ? "…" : ""))
    if (q.type === "multiple_choice") {
      console.log(`  ✓ ${q.options[q.correct_option_index ?? 0]?.slice(0, 80)}`)
    }
    if (q.type === "coding" && q.test_cases?.length) {
      console.log(`  test_cases: ${q.test_cases.length}`)
    }
  }

  if (dryRun) {
    console.log("\n(dry-run: not saved)")
    return
  }

  const generatedOnly = existsSync(seedPath(categoryId))
    ? JSON.parse(readFileSync(seedPath(categoryId), "utf8"))
    : []
  const merged = [...generatedOnly, ...normalized]
  const outPath = seedPath(categoryId)
  writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n")
  console.log(
    `\nSaved ${merged.length} generated (+ ${legacyCount} legacy seed = ${merged.length + legacyCount} total) → ${outPath}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
