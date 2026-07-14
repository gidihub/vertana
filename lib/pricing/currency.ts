/**
 * Display-only local-currency estimates for the pricing UI.
 *
 * IMPORTANT: This is cosmetic. The real, billed price is always USD, and the PPP
 * tier is always derived server-side from the geo header — the currency a user
 * picks here NEVER changes their price or tier. Rates are a static, hand-maintained
 * table (no live FX API, per the PPP spec) and are labelled "approximate" in the UI.
 *
 * To refresh: update USD_RATES and the AS_OF date below.
 */

export const RATES_AS_OF = "July 2026"

export interface SupportedCurrency {
  code: string
  /** Short label shown in the picker. */
  name: string
  /** ISO 3166-1 alpha-2 for the flag icon (EU for the euro). */
  flag: string
  /** Units of this currency per 1 USD (approximate). */
  perUsd: number
}

/**
 * Curated set of 9 display currencies. USD first (the real billing currency);
 * order matches the picker menu.
 */
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: "USD", name: "US Dollar", flag: "US", perUsd: 1 },
  { code: "NGN", name: "Nigerian Naira", flag: "NG", perUsd: 1550 },
  { code: "KES", name: "Kenyan Shilling", flag: "KE", perUsd: 129 },
  { code: "ZAR", name: "South African Rand", flag: "ZA", perUsd: 18.5 },
  { code: "GHS", name: "Ghanaian Cedi", flag: "GH", perUsd: 15 },
  { code: "UGX", name: "Ugandan Shilling", flag: "UG", perUsd: 3800 },
  { code: "TZS", name: "Tanzanian Shilling", flag: "TZ", perUsd: 2600 },
  { code: "EUR", name: "Euro", flag: "EU", perUsd: 0.92 },
  { code: "GBP", name: "British Pound", flag: "GB", perUsd: 0.79 },
]

export const DEFAULT_CURRENCY = "USD"

const RATE_BY_CODE: Record<string, number> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.perUsd]),
)

const FLAG_BY_CODE: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.flag]),
)

/**
 * Fixed currency symbols. We deliberately DON'T use Intl currency formatting for
 * the symbol: Node (server) and the browser (client) can ship different ICU data
 * and render different symbols (e.g. "ZAR 75" vs "R 75"), which would cause a
 * React hydration mismatch. Number grouping via Intl is stable, so we only use
 * Intl for the digits and prepend our own symbol.
 */
const SYMBOL_BY_CODE: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  KES: "KSh",
  ZAR: "R",
  GHS: "GH₵",
  UGX: "USh",
  TZS: "TSh",
  EUR: "€",
  GBP: "£",
}

const groupFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

export function isSupportedCurrency(code: string): boolean {
  return code in RATE_BY_CODE
}

/** ISO country code for a currency's flag (falls back to US). */
export function flagForCurrency(code: string): string {
  return FLAG_BY_CODE[code] ?? "US"
}

const EUROZONE = new Set([
  "DE", "FR", "NL", "BE", "LU", "AT", "IE", "IT", "ES", "PT", "FI", "GR",
  "CY", "MT", "EE", "LV", "LT", "SI", "SK", "HR",
])

/** Country → local display currency, where we have a rate. Others fall back to USD. */
const COUNTRY_CURRENCY: Record<string, string> = {
  GB: "GBP",
  ZA: "ZAR",
  NG: "NGN",
  KE: "KES",
  GH: "GHS",
  UG: "UGX",
  TZ: "TZS",
}

/**
 * Best local display currency for a detected country. Unknown / unmapped → USD,
 * so we never show a misleading estimate in a currency we don't have a rate for.
 */
export function defaultCurrencyForCountry(country: string | null): string {
  if (!country) return DEFAULT_CURRENCY
  if (COUNTRY_CURRENCY[country]) return COUNTRY_CURRENCY[country]
  if (EUROZONE.has(country)) return "EUR"
  return DEFAULT_CURRENCY
}

/**
 * Approximate local-currency string for a USD amount (in cents), e.g.
 * (3900, "ZAR") → "R722". Returns null for USD or unsupported codes, since the
 * headline already shows the real USD price. Uses a fixed symbol so the string
 * is identical on server and client (no ICU hydration mismatch).
 */
export function formatLocalEstimate(
  usdCents: number | null,
  code: string,
): string | null {
  // 0 is allowed (Free plan → "TSh0" so every card shares one currency);
  // null (e.g. Custom) and negatives are not.
  if (usdCents == null || usdCents < 0) return null
  if (code === DEFAULT_CURRENCY || !isSupportedCurrency(code)) return null
  const amount = (usdCents / 100) * RATE_BY_CODE[code]
  const symbol = SYMBOL_BY_CODE[code] ?? ""
  try {
    return `${symbol}${groupFormatter.format(Math.round(amount))}`
  } catch {
    return null
  }
}
