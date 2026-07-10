import assert from "node:assert/strict"
import { beforeEach, describe, it } from "node:test"

import {
  __rateLimitTesting,
  checkRateLimit,
} from "./rate-limit.ts"

const { reset, storeSizes, setLastCleanupAt, runCleanup } = __rateLimitTesting

describe("rate-limit cleanup", () => {
  beforeEach(() => {
    reset()
  })

  it("removes expired inactive keys across all namespaces", () => {
    const started = Date.now()
    checkRateLimit({
      key: "stale-a",
      limit: 5,
      windowMs: 10,
      namespace: "preview-user",
    })
    checkRateLimit({
      key: "stale-b",
      limit: 5,
      windowMs: 10,
      namespace: "preview-ip",
    })

    runCleanup(started + 50)

    assert.deepEqual(storeSizes(), {})
  })

  it("preserves active buckets while removing only expired entries", () => {
    const started = Date.now()
    checkRateLimit({
      key: "stale",
      limit: 5,
      windowMs: 10,
      namespace: "default",
    })
    checkRateLimit({
      key: "active",
      limit: 5,
      windowMs: 60_000,
      namespace: "default",
    })

    runCleanup(started + 50)

    assert.deepEqual(storeSizes(), { default: 1 })
    checkRateLimit({ key: "active", limit: 5, windowMs: 60_000 })
    assert.equal(storeSizes().default, 1)
  })

  it("does not sweep on every request when the cleanup interval has not elapsed", () => {
    const base = Date.now()
    setLastCleanupAt(base)

    checkRateLimit({ key: "stale", limit: 5, windowMs: 1 })
    checkRateLimit({ key: "active", limit: 5, windowMs: 60_000 })
    checkRateLimit({ key: "another", limit: 5, windowMs: 60_000 })

    assert.equal(storeSizes().default, 3)
  })

  it("runs periodic cleanup once the interval has elapsed", () => {
    const base = Date.now()
    setLastCleanupAt(base)

    checkRateLimit({ key: "stale", limit: 5, windowMs: 0 })
    checkRateLimit({ key: "active", limit: 5, windowMs: 60_000 })
    assert.equal(storeSizes().default, 2)

    setLastCleanupAt(base - 60_001)
    checkRateLimit({ key: "fresh", limit: 5, windowMs: 60_000 })

    assert.equal(storeSizes().default, 2)
  })
})
