import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { describe, it } from "node:test"

import { serializeAtsEvent, type AtsEvent } from "../events.ts"
import {
  WEBHOOK_EVENT_HEADER,
  WEBHOOK_IDEMPOTENCY_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  signWebhookBody,
  webhookAdapter,
} from "./webhook.ts"

const sampleEvent: AtsEvent = {
  id: "11111111-1111-1111-1111-111111111111",
  type: "attempt.submitted",
  payload: {
    orgId: "org-1",
    candidate: { id: "cand-1", email: "jane@example.com", name: "Jane" },
    assessment: { id: "test-1", title: "Backend screen" },
    score: 87,
    maxScore: 100,
    percentile: 12,
    disposition: "under_review",
    resultUrl: "https://app.vertana.test/tests/test-1/results",
    occurredAt: "2026-07-15T10:00:00.000Z",
  },
}

const config = { webhookUrl: "https://hooks.zapier.com/hooks/catch/1/abc" }

function okFetch(captured: { url?: string; init?: RequestInit }) {
  return async (url: string | URL, init?: RequestInit) => {
    captured.url = String(url)
    captured.init = init
    return new Response(null, { status: 200 })
  }
}

describe("webhookAdapter.deliver", () => {
  it("maps the event to the expected JSON body and headers", async () => {
    const captured: { url?: string; init?: RequestInit } = {}
    const res = await webhookAdapter.deliver(sampleEvent, config, {
      secret: "s3cret",
      fetchImpl: okFetch(captured) as typeof fetch,
    })

    assert.equal(res.ok, true)
    assert.equal(res.status, 200)
    assert.equal(captured.url, config.webhookUrl)

    const body = captured.init?.body as string
    assert.equal(
      body,
      JSON.stringify({
        id: sampleEvent.id,
        event: "attempt.submitted",
        data: sampleEvent.payload,
      }),
    )
    assert.deepEqual(JSON.parse(body), {
      id: sampleEvent.id,
      event: "attempt.submitted",
      data: sampleEvent.payload,
    })

    const headers = captured.init?.headers as Record<string, string>
    assert.equal(headers[WEBHOOK_EVENT_HEADER], "attempt.submitted")
    assert.equal(headers[WEBHOOK_IDEMPOTENCY_HEADER], sampleEvent.id)
  })

  it("signs the body with a verifiable HMAC-SHA256 signature", async () => {
    const captured: { url?: string; init?: RequestInit } = {}
    await webhookAdapter.deliver(sampleEvent, config, {
      secret: "s3cret",
      fetchImpl: okFetch(captured) as typeof fetch,
    })
    const headers = captured.init?.headers as Record<string, string>
    const body = captured.init?.body as string

    const expected =
      "sha256=" + createHmac("sha256", "s3cret").update(body).digest("hex")
    assert.equal(headers[WEBHOOK_SIGNATURE_HEADER], expected)
    assert.equal(signWebhookBody(serializeAtsEvent(sampleEvent), "s3cret"), expected)
  })

  it("does not retry on 4xx (config problem)", async () => {
    const res = await webhookAdapter.deliver(sampleEvent, config, {
      fetchImpl: (async () => new Response("bad", { status: 400 })) as typeof fetch,
    })
    assert.equal(res.ok, false)
    assert.equal(res.status, 400)
    assert.equal(res.retriable, false)
  })

  it("retries on 5xx (transient server error)", async () => {
    const res = await webhookAdapter.deliver(sampleEvent, config, {
      fetchImpl: (async () => new Response("err", { status: 503 })) as typeof fetch,
    })
    assert.equal(res.ok, false)
    assert.equal(res.status, 503)
    assert.equal(res.retriable, true)
  })

  it("retries on network error", async () => {
    const res = await webhookAdapter.deliver(sampleEvent, config, {
      fetchImpl: (async () => {
        throw new Error("ECONNRESET")
      }) as typeof fetch,
    })
    assert.equal(res.ok, false)
    assert.equal(res.retriable, true)
  })

  it("fails permanently on missing or unsafe URL", async () => {
    const missing = await webhookAdapter.deliver(sampleEvent, {}, {})
    assert.equal(missing.ok, false)
    assert.equal(missing.retriable, false)

    const unsafe = await webhookAdapter.deliver(
      sampleEvent,
      { webhookUrl: "https://127.0.0.1/x" },
      {},
    )
    assert.equal(unsafe.ok, false)
    assert.equal(unsafe.retriable, false)
  })
})
