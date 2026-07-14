/**
 * Purchasing-power parity (PPP) geography — the single source of truth for
 * PPP tier IDs and the country → tier map.
 *
 * Architecture (unchanged from the original Africa-only design, just global):
 *   - Tiers are a static ladder t1 (anchor / full price) → t5 (floor).
 *   - Country is detected server-side from trusted edge headers (see
 *     lib/billing/ppp.ts) and mapped to a tier here.
 *   - Unknown / missing / unmapped country → t1 (full price), NEVER the cheapest.
 *   - Sanctioned/embargoed jurisdictions are blocked entirely (no pricing, no
 *     Stripe prices) — Stripe cannot process them.
 *
 * Tier IDs are defined ONCE here and imported everywhere. Do not hand-type tier
 * strings anywhere else in the codebase.
 */

/** PPP tier ladder. t1 = anchor (full price), t5 = floor (cheapest). */
export const PPP_TIERS = ["t1", "t2", "t3", "t4", "t5"] as const
export type PppTier = (typeof PPP_TIERS)[number]

/** The full-price tier. Every fallback resolves here. */
export const ANCHOR_TIER: PppTier = "t1"

/** Env suffix for Stripe price ID fallbacks, e.g. STRIPE_PRICE_GROWTH_MONTHLY_PPP_T3. */
export const PPP_ENV_SUFFIX: Record<PppTier, string> = {
  t1: "",
  t2: "_PPP_T2",
  t3: "_PPP_T3",
  t4: "_PPP_T4",
  t5: "_PPP_T5",
}

/**
 * Sanctions / embargo jurisdictions. We do not serve pricing or create Stripe
 * prices for these — Stripe will not process them. Requests are shown a clear
 * "not available in your region" state instead of a pricing page.
 */
export const BLOCKED_COUNTRIES = new Set<string>([
  "RU",
  "BY",
  "IR",
  "KP",
  "SY",
  "CU",
])

/**
 * Explicit anchor (t1) countries. Any country not in the tier map below also
 * resolves to t1, but listing the high-income anchors explicitly lets us tell
 * "known anchor" apart from "unmapped" for logging.
 */
const T1_COUNTRIES = new Set<string>([
  "US", "CA", "GB", "IE", "DE", "FR", "NL", "BE", "LU", "AT", "CH", "DK",
  "SE", "NO", "FI", "IS", "IT", "ES", "PT", "AU", "NZ", "JP", "KR", "SG",
  "HK", "TW", "IL", "AE", "SA", "QA", "KW", "BH", "OM",
])

const T2_COUNTRIES = [
  "PL", "CZ", "SK", "HU", "SI", "HR", "EE", "LV", "LT", "GR", "CY", "MT",
  "RO", "BG", "RS", "TR", "CL", "UY", "PA", "CR", "MX", "BR", "AR", "MY",
  "TH", "CN", "MU", "SC",
]

const T3_COUNTRIES = [
  "ZA", "EG", "CO", "PE", "EC", "DO", "JM", "TT", "IN", "ID", "PH", "VN",
  "LK", "MA", "TN", "DZ", "JO", "LB", "UA", "GE", "AM", "AZ", "KZ", "UZ",
  "MN", "BW", "NA", "GA",
]

const T4_COUNTRIES = [
  "GH", "KE", "NG", "PK", "BD", "NP", "KH", "LA", "MM", "BO", "PY", "GT",
  "SV", "HN", "NI", "CI", "SN", "CM", "ZW", "ZM", "AO", "KG", "MD", "AL",
  "MK", "BA", "XK",
]

const T5_COUNTRIES = [
  "RW", "UG", "TZ", "ET", "MW", "MZ", "MG", "BF", "ML", "NE", "TD", "BJ",
  "TG", "SL", "LR", "GN", "GM", "GW", "BI", "CD", "CF", "SS", "SO", "ER",
  "YE", "AF", "TJ", "LS", "SZ", "PG", "HT",
]

/** Flat country → tier lookup, built once from the per-tier lists above. */
const COUNTRY_TIER: Record<string, PppTier> = (() => {
  const map: Record<string, PppTier> = {}
  for (const c of T2_COUNTRIES) map[c] = "t2"
  for (const c of T3_COUNTRIES) map[c] = "t3"
  for (const c of T4_COUNTRIES) map[c] = "t4"
  for (const c of T5_COUNTRIES) map[c] = "t5"
  return map
})()

/** Whether a detected country is a blocked / embargoed jurisdiction. */
export function isBlockedCountry(country: string | null): boolean {
  return !!country && BLOCKED_COUNTRIES.has(country)
}

/**
 * Resolve a PPP tier from an ISO 3166-1 alpha-2 country code.
 *
 * Load-bearing fallback: unknown, missing, unmapped, or blocked → t1 (full
 * price), never the cheapest tier. Unmapped codes are logged so the map can be
 * extended from real traffic rather than guesswork.
 */
export function pppTierForCountry(country: string | null): PppTier {
  if (!country) return ANCHOR_TIER
  if (BLOCKED_COUNTRIES.has(country)) return ANCHOR_TIER
  const mapped = COUNTRY_TIER[country]
  if (mapped) return mapped
  if (!T1_COUNTRIES.has(country)) {
    console.warn(
      `[ppp] unmapped country "${country}" → t1 (full price). Add it to lib/pricing/geo.ts if this is real traffic.`,
    )
  }
  return ANCHOR_TIER
}

let regionNames: Intl.DisplayNames | null = null
function getRegionNames(): Intl.DisplayNames | null {
  if (regionNames) return regionNames
  try {
    regionNames = new Intl.DisplayNames(["en"], { type: "region" })
  } catch {
    regionNames = null
  }
  return regionNames
}

/**
 * Human-readable country name for a code, e.g. "ZA" → "South Africa".
 * Falls back to the raw code if the runtime can't resolve it (e.g. XK).
 */
export function countryName(code: string | null): string | null {
  if (!code) return null
  const names = getRegionNames()
  if (!names) return code
  try {
    return names.of(code) ?? code
  } catch {
    return code
  }
}
