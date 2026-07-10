/**
 * Load full expanded library into Supabase after migration 013.
 * Idempotent — safe to re-run; skips categories already at target counts.
 *
 * Prerequisite: migrations 001–013 applied (013 creates library_categories + category_id).
 * Also expects 004/011/012 to have seeded legacy (48) + ML (100) + MBB (100), or
 * run apply:ml-library / apply:mbb-library first.
 *
 * Usage: node scripts/seed-full-library.mjs
 */
import { spawnSync } from "node:child_process"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

function run(script, args = []) {
  console.log(`\n> node scripts/${script} ${args.join(" ")}`.trim())
  const result = spawnSync("node", [`scripts/${script}`, ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  })
  if (result.status !== 0) {
    throw new Error(`${script} failed (exit ${result.status})`)
  }
}

async function main() {
  run("apply-generated-library.mjs", ["--tier1"])
  run("apply-generated-library.mjs", ["--tier2"])
  run("apply-generated-library.mjs", ["--tier3"])
  console.log("\nFull library seed complete.")
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
