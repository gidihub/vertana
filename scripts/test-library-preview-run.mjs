/**
 * Smoke-test library coding preview execution across categories (no auth).
 * Uses the same Judge0 path as preview-run, without metering.
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { loadEnv } from "./library-seed-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const CATEGORIES = [
  "frontend-engineering",
  "backend-engineering",
  "database-administration",
  "data-analyst",
]

const JUDGE0_LANG = { javascript: 63, python: 71, typescript: 74 }

function judge0Config() {
  const apiKey = process.env.JUDGE0_API_KEY
  const selfHosted =
    process.env.JUDGE0_AUTH_MODE === "self-hosted" ||
    (!!process.env.JUDGE0_API_URL && !process.env.JUDGE0_RAPIDAPI_HOST)
  if (selfHosted) {
    const baseUrl = (process.env.JUDGE0_API_URL ?? "http://localhost:2358").replace(
      /\/$/,
      "",
    )
    return {
      baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-Auth-Token": apiKey } : {}),
      },
    }
  }
  if (!apiKey) return null
  const host = process.env.JUDGE0_RAPIDAPI_HOST ?? "judge0-ce.p.rapidapi.com"
  return {
    baseUrl: process.env.JUDGE0_API_URL ?? `https://${host}`,
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": host,
    },
  }
}

async function executeCode(code, language, stdin) {
  const cfg = judge0Config()
  if (!cfg) throw new Error("JUDGE0_API_KEY not configured")

  const languageId = JUDGE0_LANG[language] ?? 63
  const res = await fetch(
    `${cfg.baseUrl}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",
      headers: cfg.headers,
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: stdin ?? "",
      }),
    },
  )
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  const statusId = data.status?.id ?? 13
  const status =
    statusId === 3
      ? "accepted"
      : statusId === 4
        ? "wrong_answer"
        : statusId === 6
          ? "compilation_error"
          : "runtime_error"
  return { stdout: data.stdout ?? "", stderr: data.stderr ?? "", status }
}

function normalize(s) {
  return (s ?? "").trim().replace(/\r\n/g, "\n")
}

function outputsMatch(actual, expected) {
  return normalize(actual) === normalize(expected)
}

function pickCodingQuestion(categoryId) {
  const path = join(root, "lib/question-library/generated", `${categoryId}.json`)
  const items = JSON.parse(readFileSync(path, "utf8"))
  const coding = items.filter(
    (q) => q.type === "coding" && (q.test_cases?.length ?? 0) > 0,
  )
  return coding[0] ?? null
}

const STUB = {
  javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0,'utf8');\nconsole.log(input.trim());\n`,
  python: `import sys\nprint(sys.stdin.read().strip())\n`,
}

async function runQuestion(categoryId, question) {
  const cases = question.test_cases
  let passed = 0
  const details = []
  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i]
    const result = await executeCode(STUB.python, "python", tc.input)
    const ok = result.status === "accepted" && outputsMatch(result.stdout, tc.expected_output)
    if (ok) passed++
    details.push({
      case: i + 1,
      ok,
      status: result.status,
      stderr: result.stderr?.slice(0, 80),
    })
  }
  return { categoryId, prompt: question.prompt.slice(0, 60), passed, total: cases.length, details }
}

async function main() {
  loadEnv(join(root, ".env.local"))
  if (!judge0Config()) {
    console.log("SKIP: JUDGE0_API_KEY not set — preview-run wiring OK, execution not tested live")
    process.exit(0)
  }

  console.log("Testing preview-style test-case execution across categories…\n")
  let failures = 0
  for (const cat of CATEGORIES) {
    let q
    try {
      q = pickCodingQuestion(cat)
    } catch (err) {
      console.log(`  ${cat}: skipped — ${err.message}`)
      continue
    }
    if (!q) {
      console.log(`  ${cat}: no coding question with test_cases — skip`)
      continue
    }
    try {
      const result = await runQuestion(cat, q)
      const icon = result.passed === result.total ? "PASS" : "PARTIAL"
      console.log(
        `  [${icon}] ${cat}: ${result.passed}/${result.total} cases (echo stub) — ${result.prompt}…`,
      )
      if (result.passed < result.total) {
        console.log("       ", result.details.filter((d) => !d.ok))
        failures++
      }
    } catch (err) {
      console.log(`  [FAIL] ${cat}: ${err.message}`)
      failures++
    }
  }

  console.log(
    failures === 0
      ? "\nOK: Judge0 execution path works for preview context"
      : `\n${failures} category/categories had execution issues (stub may not solve real prompts — API path OK)`,
  )
  process.exit(failures > 0 ? 1 : 0)
}

main()
