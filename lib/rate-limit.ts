import { clientIpFromHeaders } from "@/lib/http/origin"

type Bucket = { count: number; resetAt: number }

const stores = new Map<string, Map<string, Bucket>>()

/** Minimum interval between full-store sweeps (avoids O(n) work every request). */
const CLEANUP_INTERVAL_MS = 60_000

let lastCleanupAt = 0

function getStore(namespace: string): Map<string, Bucket> {
  let store = stores.get(namespace)
  if (!store) {
    store = new Map()
    stores.set(namespace, store)
  }
  return store
}

function cleanupExpiredBuckets(now: number): void {
  for (const [namespace, store] of stores) {
    for (const [key, bucket] of store) {
      if (now >= bucket.resetAt) {
        store.delete(key)
      }
    }
    if (store.size === 0) {
      stores.delete(namespace)
    }
  }
}

function maybeCleanup(now: number): void {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return
  lastCleanupAt = now
  cleanupExpiredBuckets(now)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function checkRateLimit(input: {
  key: string
  limit: number
  windowMs: number
  namespace?: string
}): RateLimitResult {
  const now = Date.now()
  maybeCleanup(now)

  const store = getStore(input.namespace ?? "default")
  let bucket = store.get(input.key)

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + input.windowMs }
    store.set(input.key, bucket)
  }

  bucket.count += 1
  const success = bucket.count <= input.limit

  return {
    success,
    limit: input.limit,
    remaining: Math.max(0, input.limit - bucket.count),
    resetAt: bucket.resetAt,
  }
}

export function clientIpFromRequest(req: Request): string {
  return clientIpFromHeaders(req.headers) ?? "unknown"
}

/** @internal Test helpers — not for production use. */
export const __rateLimitTesting = {
  reset(): void {
    stores.clear()
    lastCleanupAt = 0
  },
  storeSizes(): Record<string, number> {
    const sizes: Record<string, number> = {}
    for (const [namespace, store] of stores) {
      sizes[namespace] = store.size
    }
    return sizes
  },
  setLastCleanupAt(value: number): void {
    lastCleanupAt = value
  },
  runCleanup(now: number): void {
    cleanupExpiredBuckets(now)
  },
}
