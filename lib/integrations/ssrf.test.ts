import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { assertSafeWebhookUrl, isSafeWebhookUrl } from "./ssrf.ts"

describe("assertSafeWebhookUrl", () => {
  it("allows public https URLs", () => {
    assert.equal(isSafeWebhookUrl("https://hooks.zapier.com/hooks/catch/1/abc"), true)
    assert.equal(isSafeWebhookUrl("https://example.com/webhook"), true)
    assert.equal(isSafeWebhookUrl("https://8.8.8.8/hook"), true)
  })

  it("rejects non-https schemes", () => {
    assert.throws(() => assertSafeWebhookUrl("http://example.com/webhook"))
    assert.throws(() => assertSafeWebhookUrl("ftp://example.com/webhook"))
  })

  it("rejects localhost and loopback", () => {
    assert.equal(isSafeWebhookUrl("https://localhost/webhook"), false)
    assert.equal(isSafeWebhookUrl("https://sub.localhost/webhook"), false)
    assert.equal(isSafeWebhookUrl("https://127.0.0.1/webhook"), false)
    assert.equal(isSafeWebhookUrl("https://[::1]/webhook"), false)
  })

  it("rejects private and reserved IPv4 ranges", () => {
    assert.equal(isSafeWebhookUrl("https://10.1.2.3/x"), false)
    assert.equal(isSafeWebhookUrl("https://172.16.5.4/x"), false)
    assert.equal(isSafeWebhookUrl("https://192.168.0.10/x"), false)
    assert.equal(isSafeWebhookUrl("https://100.64.0.1/x"), false)
    assert.equal(isSafeWebhookUrl("https://0.0.0.0/x"), false)
  })

  it("rejects the cloud metadata address", () => {
    assert.equal(isSafeWebhookUrl("https://169.254.169.254/latest/meta-data"), false)
  })

  it("rejects private IPv6 ranges", () => {
    assert.equal(isSafeWebhookUrl("https://[fd00::1]/x"), false)
    assert.equal(isSafeWebhookUrl("https://[fe80::1]/x"), false)
    // Link-local spans fe80–febf, not just fe80.
    assert.equal(isSafeWebhookUrl("https://[fe90::1]/x"), false)
    // IPv4-mapped IPv6 loopback in hextet form must also be blocked.
    assert.equal(isSafeWebhookUrl("https://[::ffff:7f00:1]/x"), false)
  })

  it("rejects malformed URLs", () => {
    assert.throws(() => assertSafeWebhookUrl("not a url"))
  })
})
