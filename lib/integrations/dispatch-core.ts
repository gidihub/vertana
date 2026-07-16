import { adapterForProvider } from "@/lib/integrations/adapters/registry"

/** A connected integration row, reduced to what dispatch needs. */
export interface EnabledIntegration {
  provider: string
  config: Record<string, string>
  secret: string | null
}

/**
 * Decide which connected integrations should receive an event. Pure and
 * side-effect free so it can be unit-tested without a DB:
 *   - gated on the org's ATS entitlement (downgrade => deliver to nobody), and
 *   - limited to providers that actually have an implemented adapter.
 */
export function selectDeliveries(
  integrations: EnabledIntegration[],
  opts: { hasAts: boolean },
): EnabledIntegration[] {
  if (!opts.hasAts) return []
  return integrations.filter((i) => adapterForProvider(i.provider) != null)
}

/** Exponential backoff schedule for delivery retries: 1m, 10m, 1h. */
export const ATS_BACKOFF_MS = [60_000, 600_000, 3_600_000]

/** Backoff before the Nth attempt (1-indexed), clamped to the last step. */
export function nextBackoffMs(attempts: number): number {
  const idx = Math.min(Math.max(attempts, 1), ATS_BACKOFF_MS.length) - 1
  return ATS_BACKOFF_MS[idx]
}
