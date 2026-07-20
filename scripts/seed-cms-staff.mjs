#!/usr/bin/env node
/**
 * Seed profiles.is_staff for emails in CMS_STAFF_EMAILS.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: node scripts/seed-cms-staff.mjs
 */
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

import { loadEnv } from "./library-seed-utils.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
loadEnv(path.join(root, ".env.local"))

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const raw = process.env.CMS_STAFF_EMAILS ?? ""
const emails = raw
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

if (!emails.length) {
  console.error("Set CMS_STAFF_EMAILS in .env.local (comma-separated)")
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function listAllUsers() {
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < 1000) break
    page += 1
  }
  return users
}

let allUsers
try {
  allUsers = await listAllUsers()
} catch (err) {
  console.error("listUsers failed:", err instanceof Error ? err.message : String(err))
  process.exit(1)
}

for (const email of emails) {
  const user = allUsers.find((u) => u.email?.toLowerCase() === email)
  if (!user) {
    console.warn(`No auth user for ${email} — skip`)
    continue
  }

  const { error } = await admin.from("profiles").upsert(
    { id: user.id, is_staff: true },
    { onConflict: "id" },
  )
  if (error) {
    console.error(`profiles upsert failed for ${email}:`, error.message)
    process.exit(1)
  }
  console.log(`Staff granted: ${email}`)
}

console.log("Done.")
