import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

const RECRUITER_PREFIXES = ["/dashboard", "/tests", "/team", "/settings", "/candidates", "/library", "/analytics"]
const RECRUITER_API_PREFIXES = [
  "/api/tests",
  "/api/org",
  "/api/team",
  "/api/generate-questions",
  "/api/question-library",
]

function isRecruiterRoute(pathname: string): boolean {
  if (RECRUITER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true
  }
  return RECRUITER_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isRecruiterRoute(request.nextUrl.pathname)) {
    return response
  }

  if (!user) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const login = new URL("/login", request.url)
    login.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(login)
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/tests/:path*",
    "/candidates/:path*",
    "/library/:path*",
    "/analytics/:path*",
    "/api/tests/:path*",
    "/api/org",
    "/api/generate-questions",
    "/api/question-library",
  ],
}
