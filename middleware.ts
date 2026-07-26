import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { GEO_COUNTRY_HEADER } from "@/lib/billing/ppp"
import { countryFromIp, readGeoIpConfig } from "@/lib/pricing/geo-ip"
import {
  clientIpFromHeaders,
  countryFromEdgeHeaders,
  readGeoConfig,
} from "@/lib/pricing/geo-source"
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
 * stored in a shared cache: Cloudflare ignores `Vary` on HTML, so one cached
 * copy would serve a single country's prices to the whole world.
 */
const PPP_PERSONALIZED_PATHS = new Set(["/", "/pricing"])

/**
 * Resolve the visitor's country at the only place that sees the raw edge
 * request. Returns null when no trusted source is available, which the app
 * reads as anchor (full) pricing.
 */
async function resolveCountry(request: NextRequest): Promise<string | null> {
  const country = countryFromEdgeHeaders(request.headers, readGeoConfig())
  if (country) return country

  // No edge geo header — e.g. a DigitalOcean origin with no CDN in front. Fall
  // back to an IP lookup if one is configured, but only for the pages that
  // actually show prices, so it never sits in the path of an API call.
  if (!PPP_PERSONALIZED_PATHS.has(request.nextUrl.pathname)) return null
  return countryFromIp(clientIpFromHeaders(request.headers), readGeoIpConfig())
}

/**
 * Forward the resolved country to the app on an internal header, dropping any
 * inbound copy first so a browser cannot spoof a cheaper region. Headers are
 * re-read from the request on each call so cookie refreshes are preserved.
 */
function nextWithGeoCountry(
  request: NextRequest,
  country: string | null,
): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(GEO_COUNTRY_HEADER)
  if (country) requestHeaders.set(GEO_COUNTRY_HEADER, country)
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
  const country = await resolveCountry(request)
  let response = nextWithGeoCountry(request, country)

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
        response = nextWithGeoCountry(request, country)
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
