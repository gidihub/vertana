/**
 * Minimal user-agent parsing for the candidate report's device/browser facts.
 * Deliberately dependency-free and best-effort — UA strings are unreliable, so
 * we return readable labels and fall back to "Unknown" rather than guessing.
 */

export interface ParsedUserAgent {
  /** e.g. "Desktop - Windows", "Mobile - Android". */
  device: string
  /** e.g. "Google Chrome 120.0.0.0". */
  browser: string
}

function osLabel(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows"
  // iOS must be checked before macOS: iPhone/iPad UAs contain "like Mac OS X".
  if (/(iphone|ipad|ipod)/i.test(ua)) return "iOS"
  if (/mac os x|macintosh/i.test(ua)) return "macOS"
  if (/android/i.test(ua)) return "Android"
  if (/cros/i.test(ua)) return "ChromeOS"
  if (/linux/i.test(ua)) return "Linux"
  return "Unknown OS"
}

function deviceType(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return "Tablet"
  if (/mobi|iphone|ipod|android.*mobile/i.test(ua)) return "Mobile"
  return "Desktop"
}

function browserLabel(ua: string): string {
  // Order matters: Edge/Opera/Brave masquerade as Chrome, so check them first.
  const match = (re: RegExp, name: string): string | null => {
    const m = ua.match(re)
    return m ? `${name} ${m[1]}` : null
  }
  return (
    match(/edg\/([\d.]+)/i, "Microsoft Edge") ??
    match(/opr\/([\d.]+)/i, "Opera") ??
    match(/firefox\/([\d.]+)/i, "Mozilla Firefox") ??
    match(/chrome\/([\d.]+)/i, "Google Chrome") ??
    // Safari version lives in Version/x; the Safari token holds the build.
    match(/version\/([\d.]+).*safari/i, "Safari") ??
    "Unknown browser"
  )
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = (userAgent ?? "").trim()
  if (!ua) return { device: "Unknown", browser: "Unknown" }
  return {
    device: `${deviceType(ua)} - ${osLabel(ua)}`,
    browser: browserLabel(ua),
  }
}

/** Formats a duration in ms as a compact "0s" / "45s" / "3m 20s". */
export function formatOutsideTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s"
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}
