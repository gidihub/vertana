import { NextResponse } from "next/server"

import { assertStaff, CmsAuthError, requireStaff } from "@/lib/cms-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"

export function cmsForbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export function cmsUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function withStaff<T>(
  handler: (user: { id: string; email: string }) => Promise<T>,
): Promise<T | NextResponse> {
  try {
    const user = await requireStaff()
    return handler(user)
  } catch (err) {
    if (err instanceof CmsAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const user = await assertStaff()
    if (!user) return cmsForbidden()
    return cmsForbidden()
  }
}

export function cmsAdmin() {
  return createAdminClient()
}

export function cmsAiRateLimit(userId: string) {
  return checkRateLimit({
    key: userId,
    limit: 10,
    windowMs: 60_000,
    namespace: "cms-ai",
  })
}

export function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) },
    },
  )
}
