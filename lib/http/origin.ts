/**
 * Resolve the PUBLIC origin of the current request.
 *
 * Behind a reverse proxy (e.g. DigitalOcean App Platform, which serves the
 * container on an internal port like 8080), `new URL(request.url).origin` is the
 * internal address, not the user-facing one. Redirecting to it sends the browser
 * to `http://localhost:8080/...`, which only exists inside the container.
 *
 * Order of trust:
 *  1. `x-forwarded-host` / `x-forwarded-proto` — set by the platform's proxy.
 *  2. `NEXT_PUBLIC_SITE_URL` — the configured canonical origin.
 *  3. The request's own origin — correct in local dev (no proxy).
 */
export function publicOrigin(request: { headers: Headers; url: string }): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  if (forwardedHost) {
    const proto =
      request.headers.get("x-forwarded-proto") ??
      (forwardedHost.startsWith("localhost") ||
      forwardedHost.startsWith("127.0.0.1")
        ? "http"
        : "https")
    return `${proto}://${forwardedHost}`
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, "")

  try {
    return new URL(request.url).origin
  } catch {
    return "http://localhost:3000"
  }
}

/**
 * Loopback/unspecified addresses that must never be recorded as a client IP.
 * Behind a reverse proxy the app is reached over the loopback interface, so a
 * naive read of the connection address (or an internal proxy's `x-real-ip`)
 * yields `::1` for every candidate — misleading integrity data.
 */
function isNonClientAddress(ip: string): boolean {
  const v = ip
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "") // strip IPv6 brackets
    .replace(/%.*$/, "") // strip IPv6 zone id
  return (
    v === "" ||
    v === "::1" ||
    v === "::" ||
    v === "0.0.0.0" ||
    v === "localhost" ||
    v === "unknown" ||
    v.startsWith("127.")
  )
}

/**
 * Best-effort real client IP from proxy headers. Prefers the first public entry
 * in `x-forwarded-for` (the platform's edge sets the original client first and
 * appends proxy hops), then `x-real-ip`. Loopback/unspecified values are skipped
 * so we never store `::1` from an internal proxy hop. Returns null when no
 * usable client address is present (e.g. local dev with no proxy).
 */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const ip = part.trim()
      if (ip && !isNonClientAddress(ip)) return ip
    }
  }
  const real = headers.get("x-real-ip")?.trim()
  if (real && !isNonClientAddress(real)) return real
  return null
}
