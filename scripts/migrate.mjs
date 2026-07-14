/**
 * Sequential migration runner with a schema_migrations ledger.
 *
 * Applies every supabase/migrations/*.sql file that hasn't been recorded yet,
 * in filename order, each in its own transaction. Safe to re-run: already-applied
 * migrations are skipped.
 *
 * Usage:
 *   pnpm migrate                 # apply all pending migrations
 *   pnpm migrate --baseline=020  # mark 001..020 as applied WITHOUT running them
 *                                # (use once on an existing DB whose early
 *                                #  migrations were applied by hand)
 *   pnpm migrate --dry-run       # list pending migrations, apply nothing
 *
 * Requires DATABASE_URL, or SUPABASE_DB_PASSWORD (+ SUPABASE_URL) in .env.local.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const migrationsDir = path.join(root, "supabase/migrations")

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=")
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      }),
  )
}

function projectRef(supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match?.[1] ?? null
}

function buildConnectionString(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL

  const password = env.SUPABASE_DB_PASSWORD
  const ref = projectRef(env.SUPABASE_URL ?? "")
  if (!password || !ref) return null

  const database = env.SUPABASE_DB_NAME ?? "postgres"
  const explicitHost = env.SUPABASE_DB_HOST
  const region = env.SUPABASE_REGION ?? env.SUPABASE_DB_REGION

  // Prefer the Supabase connection pooler. The legacy direct hostnames
  // (db.<ref>.supabase.co) are deprecated and often fail to resolve, so we
  // default to the pooler whenever a region is configured (or an explicit
  // pooler host is given). The pooler requires the tenant-qualified username
  // `postgres.<ref>`, and we use the session-mode port (5432) so the migration
  // runner's parameterized statements work.
  const usingPooler =
    (explicitHost && explicitHost.includes("pooler")) || Boolean(region)

  if (usingPooler) {
    const host = explicitHost ?? `aws-0-${region}.pooler.supabase.com`
    const port = env.SUPABASE_DB_PORT ?? "5432"
    const user = env.SUPABASE_DB_USER ?? `postgres.${ref}`
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
  }

  // Legacy direct connection (only if no region/pooler host is configured).
  const host = explicitHost ?? `db.${ref}.supabase.co`
  const port = env.SUPABASE_DB_PORT ?? "5432"
  const user = env.SUPABASE_DB_USER ?? "postgres"
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

/** Numeric prefix of a migration filename, e.g. "020_foo.sql" -> 20. */
function versionNumber(fileName) {
  const match = fileName.match(/^(\d+)/)
  return match ? Number(match[1]) : Number.NaN
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const baselineArg = args.find((a) => a.startsWith("--baseline="))
  let baseline = null
  if (baselineArg) {
    const raw = baselineArg.split("=")[1]
    baseline = Number(raw)
    if (!Number.isInteger(baseline)) {
      console.error(
        `Invalid --baseline value "${raw ?? ""}". Expected an integer migration number, e.g. --baseline=24`,
      )
      process.exit(1)
    }
  }

  const env = { ...loadEnv(path.join(root, ".env.local")), ...process.env }
  const connectionString = buildConnectionString(env)
  if (!connectionString) {
    console.error(
      "Missing database credentials. Options for .env.local:\n" +
        "  1. DATABASE_URL — full Postgres connection string (takes priority), or\n" +
        "  2. SUPABASE_URL + SUPABASE_DB_PASSWORD + SUPABASE_REGION — connects via\n" +
        "     the Supabase connection pooler (aws-0-<region>.pooler.supabase.com).\n" +
        "     Find the region in Dashboard → Project Settings → Database →\n" +
        "     Connection pooling.\n" +
        "\n" +
        "Note: the legacy direct host db.<ref>.supabase.co is deprecated. Set\n" +
        "SUPABASE_REGION (non-secret) so the runner uses the pooler instead.",
    )
    process.exit(1)
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  try {
    await client.query(
      `create table if not exists schema_migrations (
         version text primary key,
         applied_at timestamptz not null default now()
       )`,
    )

    const { rows: appliedRows } = await client.query(
      "select version from schema_migrations",
    )
    const applied = new Set(appliedRows.map((r) => r.version))

    // Baseline mode: record early migrations as applied without executing them.
    if (baseline != null && !Number.isNaN(baseline)) {
      const baselined = []
      for (const file of files) {
        if (versionNumber(file) <= baseline && !applied.has(file)) {
          await client.query(
            "insert into schema_migrations (version) values ($1) on conflict do nothing",
            [file],
          )
          applied.add(file)
          baselined.push(file)
        }
      }
      console.log(
        baselined.length
          ? `Baselined (marked applied, not run):\n  ${baselined.join("\n  ")}`
          : `Nothing to baseline at or below ${baseline}.`,
      )
    }

    const pending = files.filter((f) => !applied.has(f))
    if (pending.length === 0) {
      console.log("No pending migrations. Database is up to date.")
      return
    }

    if (dryRun) {
      console.log(`Pending migrations (${pending.length}):`)
      for (const file of pending) console.log(`  ${file}`)
      console.log("\nDry run — nothing applied.")
      return
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8")
      process.stdout.write(`Applying ${file} … `)
      try {
        await client.query("begin")
        await client.query(sql)
        await client.query(
          "insert into schema_migrations (version) values ($1)",
          [file],
        )
        await client.query("commit")
        console.log("ok")
      } catch (err) {
        await client.query("rollback")
        console.log("FAILED")
        throw new Error(`${file}: ${err.message}`)
      }
    }

    console.log(`\nApplied ${pending.length} migration(s) successfully.`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message)
  process.exit(1)
})
