/**
 * Server-side geo detection for regional (PPP) pricing.
 *
 * Tier IDs and the country → tier map live in lib/pricing/geo.ts; which header
 * carries the country (Cloudflare, Vercel, a custom reverse proxy) and whether
 * it can be trusted live in lib/pricing/geo-source.ts. This module wires the two
 * together so existing call sites keep importing from "@/lib/billing/ppp".
 */

import {
  countryFromEdgeHeaders,
  normalizeCountryCode,
  readGeoConfig,
  type GeoConfig,
} from "@/lib/pricing/geo-source"
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
 * Internal header that middleware sets from the resolved edge geo, after
 * stripping any inbound copy a client may have sent (see middleware.ts).
 * Server Components read this first because platform geo headers are not
 * consistently forwarded into `headers()` on every host.
 *
 * Only trustworthy on paths covered by the middleware matcher — every path that
 * resolves a price must stay in that matcher.
 */
export const GEO_COUNTRY_HEADER = "x-vertana-geo-country"

export { normalizeCountryCode }

/**
 * Read the visitor's country from trusted server-side headers. NEVER trust a
 * client-submitted country or price — the header source and its trust rules are
 * configured in lib/pricing/geo-source.ts. Null means "use anchor pricing".
 */
export function detectCountryFromHeaders(
  headers: HeadersLike,
  config?: GeoConfig,
): string | null {
  const injected = normalizeCountryCode(headers.get(GEO_COUNTRY_HEADER))
  if (injected) return injected
  return countryFromEdgeHeaders(headers, config ?? readGeoConfig())
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
