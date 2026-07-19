import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  analyticsAllowed,
  readCookieConsent,
  writeCookieConsent,
} from "./cookie-consent"

describe("cookie-consent", () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      clear: () => store.clear(),
    }
    vi.stubGlobal("window", { localStorage } as Window)
  })

  it("returns null when nothing stored", () => {
    expect(readCookieConsent()).toBeNull()
  })

  it("persists accept with analytics enabled", () => {
    writeCookieConsent("accepted", true)
    const stored = readCookieConsent()
    expect(stored?.choice).toBe("accepted")
    expect(stored?.analytics).toBe(true)
    expect(stored?.version).toBe(COOKIE_CONSENT_VERSION)
    expect(analyticsAllowed(stored)).toBe(true)
  })

  it("persists reject with analytics disabled", () => {
    writeCookieConsent("rejected", false)
    const stored = readCookieConsent()
    expect(stored?.choice).toBe("rejected")
    expect(analyticsAllowed(stored)).toBe(false)
  })

  it("ignores malformed storage", () => {
    store.set(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ version: "old", choice: "accepted", analytics: true }),
    )
    expect(readCookieConsent()).toBeNull()
  })
})
