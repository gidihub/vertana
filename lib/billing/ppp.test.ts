import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  GEO_COUNTRY_HEADER,
  detectCountryFromHeaders,
  normalizeCountryCode,
  pppTierForCountry,
} from "./ppp.ts"

describe("normalizeCountryCode", () => {
  it("uppercases and rejects empty/XX", () => {
    assert.equal(normalizeCountryCode("za"), "ZA")
    assert.equal(normalizeCountryCode(" XX "), null)
    assert.equal(normalizeCountryCode(null), null)
  })
})

describe("detectCountryFromHeaders", () => {
  const headers = (values: Record<string, string>) => ({
    get(name: string) {
      return values[name.toLowerCase()] ?? values[name] ?? null
    },
  })

  it("prefers the middleware-injected geo header", () => {
    const country = detectCountryFromHeaders(
      headers({
        [GEO_COUNTRY_HEADER]: "ZA",
        "x-vercel-ip-country": "US",
      }),
    )
    assert.equal(country, "ZA")
  })

  it("falls back to platform headers", () => {
    assert.equal(
      detectCountryFromHeaders(headers({ "x-vercel-ip-country": "ZA" })),
      "ZA",
    )
    assert.equal(
      detectCountryFromHeaders(headers({ "cf-ipcountry": "ZA" })),
      "ZA",
    )
  })

  it("maps South Africa to PPP tier t3", () => {
    assert.equal(pppTierForCountry("ZA"), "t3")
  })
})
