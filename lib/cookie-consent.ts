export const COOKIE_CONSENT_VERSION = "v1"
export const COOKIE_CONSENT_STORAGE_KEY = "vertana-cookie-consent"

export type CookieConsentChoice = "accepted" | "rejected"

export type CookieConsentRecord = {
  version: string
  choice: CookieConsentChoice
  /** Whether optional analytics cookies are allowed. */
  analytics: boolean
  updatedAt: string
}

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsentRecord
    if (
      parsed?.version !== COOKIE_CONSENT_VERSION ||
      (parsed.choice !== "accepted" && parsed.choice !== "rejected") ||
      typeof parsed.analytics !== "boolean"
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeCookieConsent(
  choice: CookieConsentChoice,
  analytics: boolean,
): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: COOKIE_CONSENT_VERSION,
    choice,
    analytics,
    updatedAt: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // ignore quota / private mode
  }
  return record
}

export function analyticsAllowed(consent: CookieConsentRecord | null): boolean {
  return consent?.analytics === true
}

export const COOKIE_PREFS_OPEN_EVENT = "vertana:open-cookie-preferences"

export function openCookiePreferences() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(COOKIE_PREFS_OPEN_EVENT))
}
