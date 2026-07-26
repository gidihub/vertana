import { createServerClient } from "@supabase/ssr"
import { geolocation } from "@vercel/functions"
import { type NextRequest, NextResponse } from "next/server"

import {
  GEO_COUNTRY_HEADER,
  normalizeCountryCode,
} from "@/lib/billing/ppp"
import { publicOrigin } from "@/lib/http/origin"
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
 * Routes whose HTML embeds geo-personalized PPP prices. These must never be
 * publicly cached — many shared/mobile caches ignore Vary and serve anchor
 * prices to every region.
 */
const PPP_PERSONALIZED_PATHS = new Set(["/", "/pricing"])

function detectCountryAtEdge(request: NextRequest): string | null {
  const { country } = geolocation(request)
  return (
    normalizeCountryCode(country) ??
    normalizeCountryCode(request.headers.get("x-vercel-ip-country")) ??
    normalizeCountryCode(request.headers.get("cf-ipcountry"))
  )
}

/** Inject trusted geo country for downstream Server Components / route handlers. */
function nextWithGeoCountry(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(GEO_COUNTRY_HEADER)

  const country = detectCountryAtEdge(request)
  if (country) {
    requestHeaders.set(GEO_COUNTRY_HEADER, country)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

function withPricingNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate",
  )
  return response
}

export async function middleware(request: NextRequest) {
  let response = nextWithGeoCountry(request)

  if (PPP_PERSONALIZED_PATHS.has(request.nextUrl.pathname)) {
    return withPricingNoStoreHeaders(response)
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
        response = nextWithGeoCountry(request)
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // Local JWT verification (cached signing keys) instead of a network call to
  // the Auth server on every protected navigation/request. Only gates access
  // here; route handlers re-verify via requireRecruiter.
  const { data } = await supabase.auth.getClaims().catch((err) => {
    console.error("[middleware] Supabase auth getClaims failed:", err)
    return { data: null }
  })
  const isAuthenticated = Boolean(data?.claims?.sub)

  if (!isRecruiterRoute(request.nextUrl.pathname)) {
    return response
  }

  if (!isAuthenticated) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const login = new URL("/login", publicOrigin(request))
    login.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(login)
  }

  return response
}

export const config = {
  matcher: [
    "/",
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
