import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { clientIpFromHeaders } from "./origin.ts"

describe("clientIpFromHeaders", () => {
  it("returns the first entry of x-forwarded-for (the original client)", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1, 70.41.3.18",
    })
    assert.equal(clientIpFromHeaders(headers), "203.0.113.7")
  })

  it("skips a leading loopback hop and returns the first real client IP", () => {
    // An internal proxy can prepend its own loopback address; the true client
    // is the next entry, not `::1`.
    const headers = new Headers({ "x-forwarded-for": "::1, 203.0.113.7" })
    assert.equal(clientIpFromHeaders(headers), "203.0.113.7")
  })

  it("never returns a loopback address (the ::1-on-every-candidate bug)", () => {
    assert.equal(clientIpFromHeaders(new Headers({ "x-forwarded-for": "::1" })), null)
    assert.equal(clientIpFromHeaders(new Headers({ "x-real-ip": "::1" })), null)
    assert.equal(
      clientIpFromHeaders(new Headers({ "x-real-ip": "127.0.0.1" })),
      null,
    )
  })

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    assert.equal(
      clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.5" })),
      "198.51.100.5",
    )
  })

  it("strips IPv6 brackets/zone ids when deciding, returning a usable client", () => {
    const headers = new Headers({ "x-forwarded-for": "[::1], 2001:db8::1" })
    assert.equal(clientIpFromHeaders(headers), "2001:db8::1")
  })

  it("returns null when no proxy headers are present (local dev)", () => {
    assert.equal(clientIpFromHeaders(new Headers()), null)
  })
})
