import type { AtsEvent } from "@/lib/integrations/events"

export interface DeliveryResult {
  ok: boolean
  /** HTTP status when the request completed, else undefined. */
  status?: number
  error?: string
  /** true => transient (safe to retry); false => permanent (do not retry). */
  retriable: boolean
}

export interface DeliverOptions {
  /** Per-integration HMAC secret used to sign the body. */
  secret?: string
  /** Request timeout in ms (default 10s). */
  timeoutMs?: number
  /** Injectable fetch for tests. */
  fetchImpl?: typeof fetch
}

/**
 * A provider adapter turns a normalized {@link AtsEvent} into a provider call.
 * The Vertana → provider field mapping lives *inside* `deliver`, keeping the
 * dispatch core provider-agnostic. New first-class ATS adapters are additive:
 * implement this interface and register it — no dispatch changes.
 */
export interface AtsAdapter {
  id: string
  deliver(
    event: AtsEvent,
    config: Record<string, string>,
    opts?: DeliverOptions,
  ): Promise<DeliveryResult>
}
