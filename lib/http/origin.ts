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
