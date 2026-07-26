/**
 * Server-side geo detection for regional (PPP) pricing.
 *
 * Tier IDs and the country → tier map live in lib/pricing/geo.ts (the single
 * source of truth). This module only reads the trusted edge header and re-exports
 * the geo helpers so existing call sites keep importing from "@/lib/billing/ppp".
 */

import {
  ANCHOR_TIER,
  PPP_ENV_SUFFIX,
  PPP_TIERS,
  countryName,
  isBlockedCountry,
  pppTierForCountry,
  type PppTier,
} from "@/lib/pricing/geo"

export type { PppTier }
export {
  ANCHOR_TIER,
  PPP_ENV_SUFFIX,
  PPP_TIERS,
  countryName,
  isBlockedCountry,
  pppTierForCountry,
}

/** Minimal read-only headers shape (works with both Headers and Next's ReadonlyHeaders). */
export type HeadersLike = { get(name: string): string | null }

/**
 * Internal header set by middleware from trusted edge geo (see middleware.ts).
 * Server code reads this first so PPP resolution is consistent even when
 * `headers()` in a Server Component does not surface platform geo headers.
 */
export const GEO_COUNTRY_HEADER = "x-vertana-geo-country"

/** Normalize a raw country code from an edge header. */
export function normalizeCountryCode(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toUpperCase()
  return normalized && normalized !== "XX" ? normalized : null
}

/**
 * Read the geo country from trusted edge headers. NEVER trust a client-submitted
 * country or price — these headers are set by the edge/CDN, not the browser.
 */
export function detectCountryFromHeaders(headers: HeadersLike): string | null {
  // Order matters:
  // 1. Middleware-injected header (derived from @vercel/functions geolocation)
  // 2. Vercel platform header (may not reach Server Components reliably)
  // 3. Cloudflare header (only when actually proxied through Cloudflare)
  const country =
    headers.get(GEO_COUNTRY_HEADER) ??
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry")
  return normalizeCountryCode(country)
}

export function detectCountryFromRequest(req: Request): string | null {
  return detectCountryFromHeaders(req.headers)
}

/** Convenience: resolve PPP tier directly from request headers. */
export function pppTierFromHeaders(headers: HeadersLike): PppTier {
  return pppTierForCountry(detectCountryFromHeaders(headers))
}

/**
 * Coding is available in every region, including the floor tier. Self-hosted
 * Judge0 keeps per-candidate execution cost low enough that there's no need to
 * gate coding regionally (see pricing plan §9 unit economics).
 */
export function codingAllowedForPppTier(_tier: PppTier): boolean {
  return true
}
