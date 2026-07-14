import { NextResponse } from "next/server"

import { setupOrganizationForUser } from "@/lib/auth/recruiter"
import { publicOrigin } from "@/lib/http/origin"
import { createClient } from "@/lib/supabase/server"

function safeRedirectPath(next: string | null, origin: string): string {
  const fallback = "/dashboard"
  if (!next) return fallback
  if (!next.startsWith("/") || next.startsWith("//")) return fallback

  try {
    const resolved = new URL(next, origin)
    if (resolved.origin !== origin) return fallback
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return fallback
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Use the public origin (not request.url) so redirects work behind a proxy.
  const origin = publicOrigin(request)
  const code = searchParams.get("code")
  const destination = safeRedirectPath(searchParams.get("next"), origin)

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await setupOrganizationForUser({
      userId: user.id,
      orgName: "My Organization",
      email: user.email,
    })
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
