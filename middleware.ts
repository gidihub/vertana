import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

const RECRUITER_PREFIXES = ["/dashboard", "/tests", "/team", "/settings", "/candidates", "/library", "/analytics"]
const RECRUITER_API_PREFIXES = [
  "/api/tests",
  "/api/org",
  "/api/team",
  "/api/billing/checkout",
  "/api/billing/portal",
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

/**
 * The homepage and pricing page each render one URL but vary their prices by the
 * trusted `x-vercel-ip-country` edge header (PPP). Tell the CDN to key its cache
 * on that header so each region gets the right prices without creating duplicate,
 * separately-indexed URLs. Crawlers (no geo header) receive the anchor version.
 */
const PPP_CACHED_PATHS = new Set(["/", "/pricing"])

function withPricingCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set("Vary", "x-vercel-ip-country")
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  )
  return response
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (PPP_CACHED_PATHS.has(request.nextUrl.pathname)) {
    return withPricingCacheHeaders(response)
  }

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
  } = await supabase.auth.getUser().catch((err) => {
    console.error("[middleware] Supabase auth getUser failed:", err)
    return { data: { user: null }, error: err }
  })

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
    "/pricing",
    "/dashboard/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/tests/:path*",
    "/candidates/:path*",
    "/library/:path*",
    "/analytics/:path*",
    "/api/tests/:path*",
    "/api/org",
    "/api/billing/checkout",
    "/api/billing/portal",
    "/api/generate-questions",
    "/api/question-library/:path*",
  ],
}
