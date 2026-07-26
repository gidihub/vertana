/**
 * Optional IP → country lookup, for deployments with no edge geo header at all
 * (e.g. a DigitalOcean Droplet or App Platform app that isn't behind
 * Cloudflare). Disabled unless GEO_IP_LOOKUP_URL is set.
 *
 * Kept deliberately small: one outbound call per unseen IP, memoised in-process,
 * short timeout, and every failure resolves to null (→ anchor pricing) so a slow
 * or broken lookup service can never block a page render or hand out a discount.
 */

import { normalizeCountryCode, type EnvLike } from "@/lib/pricing/geo-source"

export interface GeoIpConfig {
  /** URL template containing `{ip}`, e.g. https://ipapi.co/{ip}/country/ */
  urlTemplate: string | null
  /** JSON field holding the country code. Unset = response body is the code. */
  jsonField: string | null
  timeoutMs: number
}

/** Literal reads so the values survive edge/middleware bundling. */
function envFromProcess(): EnvLike {
  return {
    GEO_IP_LOOKUP_URL: process.env.GEO_IP_LOOKUP_URL,
    GEO_IP_LOOKUP_JSON_FIELD: process.env.GEO_IP_LOOKUP_JSON_FIELD,
    GEO_IP_LOOKUP_TIMEOUT_MS: process.env.GEO_IP_LOOKUP_TIMEOUT_MS,
  }
}

export function readGeoIpConfig(env: EnvLike = envFromProcess()): GeoIpConfig {
  const timeout = Number(env.GEO_IP_LOOKUP_TIMEOUT_MS)
  return {
    urlTemplate: env.GEO_IP_LOOKUP_URL?.trim() || null,
    jsonField: env.GEO_IP_LOOKUP_JSON_FIELD?.trim() || null,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 700,
  }
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 5_000

type CacheEntry = { country: string | null; expiresAt: number }
const cache = new Map<string, CacheEntry>()

function cacheGet(ip: string): CacheEntry | null {
  const hit = cache.get(ip)
  if (!hit) return null
  if (hit.expiresAt < Date.now()) {
    cache.delete(ip)
    return null
  }
  return hit
}

function cacheSet(ip: string, country: string | null): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Cheap eviction: drop the oldest insertion.
    const oldest = cache.keys().next()
    if (!oldest.done) cache.delete(oldest.value)
  }
  cache.set(ip, { country, expiresAt: Date.now() + CACHE_TTL_MS })
}

/** Private/loopback ranges never resolve to a country — skip the round trip. */
function isPrivateAddress(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd")) return true
  const octets = ip.split(".").map(Number)
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n))) {
    return false
  }
  const [a, b] = octets
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  )
}

async function parseCountry(
  response: Response,
  jsonField: string | null,
): Promise<string | null> {
  if (!jsonField) {
    return normalizeCountryCode(await response.text())
  }
  const body = (await response.json()) as Record<string, unknown>
  const value = body?.[jsonField]
  return typeof value === "string" ? normalizeCountryCode(value) : null
}

/**
 * Look up a country for an IP. Returns null when lookup is disabled, the IP is
 * private, or anything at all goes wrong.
 */
export async function countryFromIp(
  ip: string | null,
  config: GeoIpConfig = readGeoIpConfig(),
): Promise<string | null> {
  if (!ip || !config.urlTemplate || isPrivateAddress(ip)) return null

  const cached = cacheGet(ip)
  if (cached) return cached.country

  try {
    const response = await fetch(
      config.urlTemplate.replace("{ip}", encodeURIComponent(ip)),
      {
        signal: AbortSignal.timeout(config.timeoutMs),
        headers: { accept: config.jsonField ? "application/json" : "text/plain" },
      },
    )
    if (!response.ok) {
      cacheSet(ip, null)
      return null
    }
    const country = await parseCountry(response, config.jsonField)
    cacheSet(ip, country)
    return country
  } catch {
    // Timeout, DNS failure, rate limit — fail open to anchor pricing.
    cacheSet(ip, null)
    return null
  }
}

/** Test seam. */
export function clearGeoIpCache(): void {
  cache.clear()
}
