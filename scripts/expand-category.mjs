/**
 * Expand a library category to a target total (legacy seed + generated).
 *
 * Usage:
 *   node scripts/expand-category.mjs devops-cloud 40
 *   node scripts/expand-category.mjs --tier2
 *   node scripts/expand-category.mjs --tier3
 */
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { legacySeedCount } from "./library-seed-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const TIER2_TARGETS = {
  "devops-cloud": 40,
  "qa-testing": 40,
  "business-financial-analysis": 40,
  "customer-technical-support": 40,
  "sales-growth-marketing": 40,
}

const TIER3_TARGETS = {
  "mobile-engineering": 30,
  "database-administration": 30,
  "ux-design": 30,
  "hr-people-management": 30,
  "ai-governance": 30,
  "remote-collaboration": 30,
}

function generatedCount(categoryId) {
  const path = join(root, "lib/question-library/generated", `${categoryId}.json`)
  if (!existsSync(path)) return 0
  return JSON.parse(readFileSync(path, "utf8")).length
}

function runBatch(categoryId, count) {
  const result = spawnSync(
    "node",
    ["scripts/generate-library-batch.mjs", categoryId, String(count)],
    { cwd: root, stdio: "inherit", env: process.env },
  )
  if (result.status !== 0) {
    throw new Error(`Batch failed for ${categoryId} (exit ${result.status})`)
  }
}

async function expand(categoryId, targetTotal) {
  const legacy = legacySeedCount(categoryId)
  const targetGenerated = Math.max(0, targetTotal - legacy)
  let current = generatedCount(categoryId)

  if (current >= targetGenerated) {
    console.log(
      `${categoryId}: already at ${legacy + current}/${targetTotal} — skipping`,
    )
    return
  }

  console.log(
    `\n=== ${categoryId}: ${legacy} legacy + ${current}/${targetGenerated} generated (target ${targetTotal}) ===`,
  )

  while (current < targetGenerated) {
    const need = Math.min(25, targetGenerated - current)
    console.log(`Generating batch of ${need}…`)
    runBatch(categoryId, need)
    current = generatedCount(categoryId)
    console.log(`Progress: ${legacy + current}/${targetTotal}`)
  }

  console.log(`${categoryId}: complete at ${legacy + current} questions`)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes("--tier2")) {
    for (const [categoryId, target] of Object.entries(TIER2_TARGETS)) {
      await expand(categoryId, target)
    }
    return
  }

  if (args.includes("--tier3")) {
    for (const [categoryId, target] of Object.entries(TIER3_TARGETS)) {
      await expand(categoryId, target)
    }
    return
  }

  const categoryId = args[0]
  const targetTotal = Number(args[1])
  if (!categoryId || !targetTotal) {
    console.error(
      "Usage: node scripts/expand-category.mjs <category-id> <target-total>\n       node scripts/expand-category.mjs --tier2\n       node scripts/expand-category.mjs --tier3",
    )
    process.exit(1)
  }

  await expand(categoryId, targetTotal)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
