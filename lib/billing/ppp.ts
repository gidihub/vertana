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
 * Read the geo country from trusted edge headers. NEVER trust a client-submitted
 * country or price — these headers are set by the edge/CDN, not the browser.
 */
export function detectCountryFromHeaders(headers: HeadersLike): string | null {
  // Order matters: prefer the header set by the current hosting platform, which
  // the platform overwrites on every request and a client cannot forge. On
  // Vercel that is `x-vercel-ip-country`. `cf-ipcountry` is only trustworthy when
  // actually served through Cloudflare; listing it last avoids a client spoofing
  // a cheaper PPP tier by sending `cf-ipcountry` to a non-Cloudflare origin.
  const country =
    headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry")
  const normalized = country?.trim().toUpperCase()
  return normalized && normalized !== "XX" ? normalized : null
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
