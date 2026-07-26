import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { GEO_COUNTRY_HEADER, detectCountryFromHeaders } from "./ppp.ts"
import {
  clientIpFromHeaders,
  countryFromEdgeHeaders,
  normalizeCountryCode,
  proxySecretRejected,
  readGeoConfig,
} from "../pricing/geo-source.ts"
import { pppTierForCountry } from "../pricing/geo.ts"

const headers = (values: Record<string, string>) => ({
  get(name: string) {
    return values[name.toLowerCase()] ?? null
  },
})

describe("normalizeCountryCode", () => {
  it("uppercases valid ISO codes", () => {
    assert.equal(normalizeCountryCode("za"), "ZA")
    assert.equal(normalizeCountryCode(" gb "), "GB")
  })

  it("rejects unknown sentinels and malformed values", () => {
    assert.equal(normalizeCountryCode("XX"), null)
    assert.equal(normalizeCountryCode("ZZ"), null)
    assert.equal(normalizeCountryCode("SOUTH AFRICA"), null)
    assert.equal(normalizeCountryCode(""), null)
    assert.equal(normalizeCountryCode(null), null)
  })
})

describe("countryFromEdgeHeaders", () => {
  it("reads Cloudflare's header in auto mode", () => {
    const config = readGeoConfig({})
    assert.equal(
      countryFromEdgeHeaders(headers({ "cf-ipcountry": "ZA" }), config),
      "ZA",
    )
  })

  it("reads a custom reverse-proxy header when configured", () => {
    const config = readGeoConfig({
      GEO_PROVIDER: "custom",
      GEO_COUNTRY_HEADERS: "x-proxy-country",
    })
    assert.equal(
      countryFromEdgeHeaders(headers({ "x-proxy-country": "ZA" }), config),
      "ZA",
    )
    // Other headers are ignored so a stray upstream value can't win.
    assert.equal(
      countryFromEdgeHeaders(headers({ "cf-ipcountry": "RW" }), config),
      null,
    )
  })

  it("resolves to anchor when custom is set with no configured headers", () => {
    const config = readGeoConfig({ GEO_PROVIDER: "custom" })
    // Must not silently trust known provider headers like cf-ipcountry here.
    assert.equal(
      countryFromEdgeHeaders(headers({ "cf-ipcountry": "RW" }), config),
      null,
    )
  })

  it("ignores geo when the provider is pinned to another platform", () => {
    const config = readGeoConfig({ GEO_PROVIDER: "vercel" })
    assert.equal(
      countryFromEdgeHeaders(headers({ "cf-ipcountry": "RW" }), config),
      null,
    )
  })

  it("requires the proxy secret when one is configured", () => {
    const config = readGeoConfig({
      GEO_PROVIDER: "cloudflare",
      GEO_PROXY_SECRET: "s3cret",
    })

    // Direct-to-origin request forging a cheap country: rejected → anchor.
    assert.equal(
      countryFromEdgeHeaders(headers({ "cf-ipcountry": "RW" }), config),
      null,
    )

    assert.equal(
      countryFromEdgeHeaders(
        headers({ "cf-ipcountry": "ZA", "x-geo-proxy-secret": "s3cret" }),
        config,
      ),
      "ZA",
    )
  })

  it("falls back to a configured default country", () => {
    const config = readGeoConfig({ GEO_DEFAULT_COUNTRY: "ZA" })
    assert.equal(countryFromEdgeHeaders(headers({}), config), "ZA")
  })

  it("returns null when geo is disabled", () => {
    const config = readGeoConfig({ GEO_PROVIDER: "none" })
    assert.equal(
      countryFromEdgeHeaders(headers({ "cf-ipcountry": "ZA" }), config),
      null,
    )
  })
})

describe("proxySecretRejected", () => {
  it("is false when no secret is configured", () => {
    const config = readGeoConfig({})
    assert.equal(proxySecretRejected(headers({}), config), false)
  })

  it("is true when a secret is configured but missing or wrong", () => {
    const config = readGeoConfig({ GEO_PROXY_SECRET: "s3cret" })
    assert.equal(proxySecretRejected(headers({}), config), true)
    assert.equal(
      proxySecretRejected(headers({ "x-geo-proxy-secret": "nope" }), config),
      true,
    )
  })

  it("is false when the configured secret matches", () => {
    const config = readGeoConfig({ GEO_PROXY_SECRET: "s3cret" })
    assert.equal(
      proxySecretRejected(headers({ "x-geo-proxy-secret": "s3cret" }), config),
      false,
    )
  })
})

describe("detectCountryFromHeaders", () => {
  it("prefers the middleware-injected header", () => {
    const country = detectCountryFromHeaders(
      headers({ [GEO_COUNTRY_HEADER]: "ZA", "cf-ipcountry": "US" }),
      readGeoConfig({}),
    )
    assert.equal(country, "ZA")
  })

  it("falls back to the edge header when middleware did not run", () => {
    assert.equal(
      detectCountryFromHeaders(
        headers({ "cf-ipcountry": "ZA" }),
        readGeoConfig({}),
      ),
      "ZA",
    )
  })
})

describe("clientIpFromHeaders", () => {
  it("prefers Cloudflare's connecting IP", () => {
    assert.equal(
      clientIpFromHeaders(
        headers({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }),
      ),
      "1.2.3.4",
    )
  })

  it("takes the left-most entry of x-forwarded-for", () => {
    assert.equal(
      clientIpFromHeaders(headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })),
      "1.2.3.4",
    )
  })
})

describe("PPP tier mapping", () => {
  it("maps South Africa to t3 and unknown to the anchor", () => {
    assert.equal(pppTierForCountry("ZA"), "t3")
    assert.equal(pppTierForCountry(null), "t1")
  })
})
