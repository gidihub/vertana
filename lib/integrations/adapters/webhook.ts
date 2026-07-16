import { createHmac } from "node:crypto"

import {
  serializeAtsEvent,
  type AtsEvent,
} from "@/lib/integrations/events"
import { assertSafeWebhookUrl } from "@/lib/integrations/ssrf"
import type { AtsAdapter, DeliveryResult } from "@/lib/integrations/adapters/types"

export const WEBHOOK_SIGNATURE_HEADER = "X-Vertana-Signature"
export const WEBHOOK_EVENT_HEADER = "X-Vertana-Event"
export const WEBHOOK_IDEMPOTENCY_HEADER = "Idempotency-Key"
const DEFAULT_TIMEOUT_MS = 10_000

/** HMAC-SHA256 over the raw body, hex, prefixed with the algorithm. */
export function signWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`
}

/**
 * Generic outbound webhook. Covers Zapier, Make, n8n, and any customer endpoint
 * — one adapter, many destinations. POSTs the normalized event as JSON and signs
 * it so receivers can verify authenticity.
 */
export const webhookAdapter: AtsAdapter = {
  id: "webhook",
  async deliver(event: AtsEvent, config, opts): Promise<DeliveryResult> {
    const url = config.webhookUrl
    if (!url) {
      return { ok: false, error: "Missing webhook URL", retriable: false }
    }
    try {
      assertSafeWebhookUrl(url)
    } catch (err) {
      return { ok: false, error: (err as Error).message, retriable: false }
    }

    const body = serializeAtsEvent(event)
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [WEBHOOK_EVENT_HEADER]: event.type,
      // Stable idempotency key so retries of the same event are dedupable.
      [WEBHOOK_IDEMPOTENCY_HEADER]: event.id,
    }
    if (opts?.secret) {
      headers[WEBHOOK_SIGNATURE_HEADER] = signWebhookBody(body, opts.secret)
    }

    const fetchImpl = opts?.fetchImpl ?? fetch
    const controller = new AbortController()
    const timer = setTimeout(
      () => controller.abort(),
      opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )

    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      })
      if (res.ok) {
        return { ok: true, status: res.status, retriable: false }
      }
      // 4xx: the endpoint rejected the payload — a config problem, don't retry.
      // 5xx: transient server error — retry.
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}`,
        retriable: res.status >= 500,
      }
    } catch (err) {
      // Network error / timeout / abort — transient, retry.
      return { ok: false, error: (err as Error).message, retriable: true }
    } finally {
      clearTimeout(timer)
    }
  },
}
