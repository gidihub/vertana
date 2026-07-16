import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { parseUserAgent, formatOutsideTime } from "./user-agent.ts"

describe("parseUserAgent", () => {
  it("identifies Windows + Chrome", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    const parsed = parseUserAgent(ua)
    assert.equal(parsed.device, "Desktop - Windows")
    assert.equal(parsed.browser, "Google Chrome 150.0.0.0")
  })

  it("identifies macOS + Safari", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
    const parsed = parseUserAgent(ua)
    assert.equal(parsed.device, "Desktop - macOS")
    assert.equal(parsed.browser, "Safari 17.0")
  })

  it("identifies iPhone as iOS despite the 'like Mac OS X' token", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    const parsed = parseUserAgent(ua)
    assert.equal(parsed.device, "Mobile - iOS")
    assert.equal(parsed.browser, "Safari 17.0")
  })

  it("identifies Android mobile + Chrome", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    const parsed = parseUserAgent(ua)
    assert.equal(parsed.device, "Mobile - Android")
    assert.equal(parsed.browser, "Google Chrome 120.0.0.0")
  })

  it("prefers Edge over its embedded Chrome token", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"
    assert.equal(parseUserAgent(ua).browser, "Microsoft Edge 150.0.0.0")
  })

  it("falls back to Unknown for empty input", () => {
    assert.deepEqual(parseUserAgent(""), { device: "Unknown", browser: "Unknown" })
    assert.deepEqual(parseUserAgent(null), { device: "Unknown", browser: "Unknown" })
  })
})

describe("formatOutsideTime", () => {
  it("formats zero and negatives as 0s", () => {
    assert.equal(formatOutsideTime(0), "0s")
    assert.equal(formatOutsideTime(-5), "0s")
  })

  it("formats sub-minute durations", () => {
    assert.equal(formatOutsideTime(45_000), "45s")
  })

  it("formats whole minutes", () => {
    assert.equal(formatOutsideTime(120_000), "2m")
  })

  it("formats minutes and seconds", () => {
    assert.equal(formatOutsideTime(200_000), "3m 20s")
  })
})
