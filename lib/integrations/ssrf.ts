/**
 * Guard against pointing an outbound webhook at internal infrastructure.
 *
 * The webhook URL is customer-supplied config (owner/admin only), not
 * attacker-supplied — but the server POSTs to whatever is stored, so we block
 * the obvious SSRF targets (localhost, loopback, private/link-local ranges, and
 * the cloud metadata IP) at save time and again right before delivery.
 *
 * This is a literal-URL check; it does not defend against DNS rebinding. For a
 * customer-config surface that trade-off is acceptable and matches the spec.
 */

function ipv4ToParts(host: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return null
  const parts = m.slice(1, 5).map((n) => Number(n))
  if (parts.some((n) => n < 0 || n > 255)) return null
  return parts
}

function isPrivateIpv4(host: string): boolean {
  const p = ipv4ToParts(host)
  if (!p) return false
  const [a, b] = p
  if (a === 10) return true // 10.0.0.0/8
  if (a === 127) return true // loopback 127.0.0.0/8
  if (a === 0) return true // 0.0.0.0/8
  if (a === 169 && b === 254) return true // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT 100.64.0.0/10
  return false
}

function isBlockedIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase()
  if (h === "::1" || h === "::") return true // loopback / unspecified
  if (h.startsWith("fe80")) return true // link-local
  if (h.startsWith("fc") || h.startsWith("fd")) return true // unique-local fc00::/7
  if (h.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — validate the embedded v4.
    return isPrivateIpv4(h.slice("::ffff:".length))
  }
  return false
}

/** Throws with a user-facing message when the URL is unsafe to POST to. */
export function assertSafeWebhookUrl(raw: string): void {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("Enter a valid webhook URL")
  }

  if (url.protocol !== "https:") {
    throw new Error("Webhook URL must use https")
  }

  const host = url.hostname.toLowerCase()

  if (
    host === "localhost" ||
    host === "localhost." ||
    host.endsWith(".localhost")
  ) {
    throw new Error("Webhook URL cannot point to localhost")
  }

  if (isPrivateIpv4(host) || isBlockedIpv6(host)) {
    throw new Error("Webhook URL cannot point to a private or reserved address")
  }
}

export function isSafeWebhookUrl(raw: string): boolean {
  try {
    assertSafeWebhookUrl(raw)
    return true
  } catch {
    return false
  }
}
