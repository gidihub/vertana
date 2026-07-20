import { createClient } from "@/lib/supabase/server"

export type CmsUser = {
  id: string
  email: string
}

export function isStaffEmail(email: string): boolean {
  const raw = process.env.CMS_STAFF_EMAILS ?? ""
  if (!raw.trim()) return false
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase())
}

export async function getCurrentUser(): Promise<CmsUser | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null
  const email = (claims.email as string | undefined)?.trim()
  if (!email) return null
  return { id: claims.sub as string, email }
}

/** Returns the user when email is on the CMS staff allowlist; otherwise null. */
export async function assertStaff(): Promise<CmsUser | null> {
  const user = await getCurrentUser()
  if (!user?.email) return null
  return isStaffEmail(user.email) ? user : null
}

export async function requireStaff(): Promise<CmsUser> {
  const user = await assertStaff()
  if (!user) {
    throw new CmsAuthError("Forbidden", 403)
  }
  return user
}

export class CmsAuthError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}
