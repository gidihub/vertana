import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

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

  const host = env.SUPABASE_DB_HOST ?? `db.${ref}.supabase.co`
  const port = env.SUPABASE_DB_PORT ?? "5432"
  const user = env.SUPABASE_DB_USER ?? "postgres"
  const database = env.SUPABASE_DB_NAME ?? "postgres"

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

async function main() {
  const env = {
    ...loadEnv(path.join(root, ".env.local")),
    ...process.env,
  }

  const connectionString = buildConnectionString(env)
  if (!connectionString) {
    console.error(
      "Missing database credentials. Add SUPABASE_DB_PASSWORD to .env.local\n" +
        "(the password you set when creating the Supabase project),\n" +
        "or set DATABASE_URL to the full Postgres connection string.",
    )
    process.exit(1)
  }

  const sql = fs.readFileSync(
    path.join(root, "supabase/migrations/001_initial_schema.sql"),
    "utf8",
  )

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    await client.query(sql)
    const { rows } = await client.query(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    )
    console.log("Migration applied successfully.")
    console.log("Tables:", rows.map((r) => r.tablename).join(", "))
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message)
  process.exit(1)
})
