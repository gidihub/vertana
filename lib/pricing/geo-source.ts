/**
 * Platform-agnostic geo detection for regional (PPP) pricing.
 *
 * Vertana can run behind Cloudflare, on Vercel, on DigitalOcean (App Platform
 * or a Droplet), or behind any reverse proxy. Each of those puts the visitor's
 * country in a different header — or none at all — so the source is configured
 * rather than hardcoded.
 *
 * SECURITY MODEL
 * --------------
 * A geo header is only trustworthy when the origin cannot be reached directly.
 * If the origin is publicly reachable (very common on DigitalOcean, where the
 * app also answers on *.ondigitalocean.app or the Droplet IP), anyone can send
 * `cf-ipcountry: RW` and buy at the cheapest tier — the same headers decide the
 * Stripe price at checkout.
 *
 * Two defences, in order of preference:
 *   1. GEO_PROXY_SECRET — the edge (e.g. a Cloudflare Transform Rule) adds a
 *      secret header. Requests without it get no geo at all, so a direct-to-
 *      origin request falls back to anchor (full) pricing.
 *   2. Firewall the origin so only the edge can reach it (Cloudflare IP ranges
 *      / DigitalOcean trusted sources). Then the header alone is enough.
 *
 * Every failure path resolves to anchor pricing, never the cheapest tier.
 */

/** Where the country code comes from. `auto` tries every known header. */
export type GeoProvider =
  | "auto"
  | "cloudflare"
  | "vercel"
  | "custom"
  | "none"

/**
 * Known edge geo headers, most specific first. Used by `auto`, and as the
 * fallback chain for providers that don't define their own header.
 */
const KNOWN_GEO_HEADERS = [
  "cf-ipcountry", // Cloudflare (Network → IP Geolocation must be on)
  "x-vercel-ip-country", // Vercel
  "cloudfront-viewer-country", // AWS CloudFront
  "x-appengine-country", // Google App Engine / Cloud CDN
  "x-geo-country", // common custom / nginx GeoIP convention
  "x-country-code",
] as const

const PROVIDER_HEADERS: Record<
  Exclude<GeoProvider, "auto" | "custom" | "none">,
  string[]
> = {
  cloudflare: ["cf-ipcountry"],
  vercel: ["x-vercel-ip-country"],
}

/** Headers carrying the client IP, most trustworthy first. */
const CLIENT_IP_HEADERS = [
  "cf-connecting-ip",
  "true-client-ip",
  "x-real-ip",
  "do-connecting-ip",
  "x-forwarded-for",
] as const

export interface GeoConfig {
  provider: GeoProvider
  /** Header names to read when provider is "custom". */
  customHeaders: string[]
  /** When set, geo headers are ignored unless this header matches the secret. */
  secretHeader: string
  secret: string | null
  /** Dev/staging override used when no trusted header is present. */
  defaultCountry: string | null
}

export type EnvLike = Record<string, string | undefined>

function parseProvider(value: string | undefined): GeoProvider {
  switch (value?.trim().toLowerCase()) {
    case "cloudflare":
      return "cloudflare"
    case "vercel":
      return "vercel"
    case "custom":
      return "custom"
    case "none":
      return "none"
    default:
      return "auto"
  }
}

function parseHeaderList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Static `process.env.X` reads. Bundlers (including the Next edge/middleware
 * bundle) only substitute env vars that are referenced literally, so dynamic
 * `env[name]` lookups would silently come back undefined there.
 */
function envFromProcess(): EnvLike {
  return {
    GEO_PROVIDER: process.env.GEO_PROVIDER,
    GEO_COUNTRY_HEADERS: process.env.GEO_COUNTRY_HEADERS,
    GEO_PROXY_SECRET_HEADER: process.env.GEO_PROXY_SECRET_HEADER,
    GEO_PROXY_SECRET: process.env.GEO_PROXY_SECRET,
    GEO_DEFAULT_COUNTRY: process.env.GEO_DEFAULT_COUNTRY,
  }
}

export function readGeoConfig(env: EnvLike = envFromProcess()): GeoConfig {
  return {
    provider: parseProvider(env.GEO_PROVIDER),
    customHeaders: parseHeaderList(env.GEO_COUNTRY_HEADERS),
    secretHeader: (
      env.GEO_PROXY_SECRET_HEADER ?? "x-geo-proxy-secret"
    ).toLowerCase(),
    secret: env.GEO_PROXY_SECRET?.trim() || null,
    defaultCountry: normalizeCountryCode(env.GEO_DEFAULT_COUNTRY),
  }
}

/** Uppercase a country code, rejecting the "unknown" sentinels edges emit. */
export function normalizeCountryCode(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toUpperCase()
  if (!normalized) return null
  if (normalized === "XX" || normalized === "T1" || normalized === "ZZ") {
    return null
  }
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null
}

/** Length-independent comparison so a wrong secret leaks no timing signal. */
function secretMatches(expected: string, received: string | null): boolean {
  if (received == null || expected.length !== received.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  }
  return diff === 0
}

export type HeaderReader = { get(name: string): string | null }

function headersForProvider(config: GeoConfig): readonly string[] {
  switch (config.provider) {
    case "none":
      return []
    case "custom":
      return config.customHeaders.length
        ? config.customHeaders
        : KNOWN_GEO_HEADERS
    case "auto":
      return KNOWN_GEO_HEADERS
    default:
      return PROVIDER_HEADERS[config.provider]
  }
}

/**
 * Country from trusted edge headers, or null when nothing trustworthy is
 * present. Callers must treat null as "use anchor pricing".
 */
export function countryFromEdgeHeaders(
  headers: HeaderReader,
  config: GeoConfig = readGeoConfig(),
): string | null {
  if (config.secret && !secretMatches(config.secret, headers.get(config.secretHeader))) {
    return null
  }

  for (const name of headersForProvider(config)) {
    const country = normalizeCountryCode(headers.get(name))
    if (country) return country
  }

  return config.defaultCountry
}

/** Client IP for an optional IP→country lookup. Null when undeterminable. */
export function clientIpFromHeaders(headers: HeaderReader): string | null {
  for (const name of CLIENT_IP_HEADERS) {
    const raw = headers.get(name)
    if (!raw) continue
    // x-forwarded-for is a chain: the left-most entry is the original client.
    const first = raw.split(",")[0]?.trim()
    if (first) return first
  }
  return null
}

/** True when no geo source is configured or reachable — useful for diagnostics. */
export function geoSourceSummary(config: GeoConfig = readGeoConfig()): {
  provider: GeoProvider
  headers: readonly string[]
  secretRequired: boolean
  defaultCountry: string | null
} {
  return {
    provider: config.provider,
    headers: headersForProvider(config),
    secretRequired: Boolean(config.secret),
    defaultCountry: config.defaultCountry,
  }
}
