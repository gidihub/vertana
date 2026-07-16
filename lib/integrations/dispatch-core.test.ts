import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  ATS_BACKOFF_MS,
  nextBackoffMs,
  selectDeliveries,
  type EnabledIntegration,
} from "./dispatch-core.ts"

const zapier: EnabledIntegration = {
  provider: "zapier",
  config: { webhookUrl: "https://hooks.zapier.com/x" },
  secret: "s",
}
// Greenhouse is in the catalog but has no outbound adapter yet.
const greenhouse: EnabledIntegration = {
  provider: "greenhouse",
  config: { apiKey: "k" },
  secret: null,
}

describe("selectDeliveries", () => {
  it("selects connected providers that have an adapter when entitled", () => {
    const out = selectDeliveries([zapier], { hasAts: true })
    assert.equal(out.length, 1)
    assert.equal(out[0].provider, "zapier")
  })

  it("selects nothing when there are no integrations", () => {
    assert.equal(selectDeliveries([], { hasAts: true }).length, 0)
  })

  it("selects nothing when the org is not ATS-entitled, even with a stale row", () => {
    assert.equal(selectDeliveries([zapier], { hasAts: false }).length, 0)
  })

  it("skips connected providers that have no implemented adapter", () => {
    const out = selectDeliveries([greenhouse, zapier], { hasAts: true })
    assert.deepEqual(
      out.map((i) => i.provider),
      ["zapier"],
    )
  })
})

describe("nextBackoffMs", () => {
  it("follows the 1m / 10m / 1h schedule", () => {
    assert.equal(nextBackoffMs(1), 60_000)
    assert.equal(nextBackoffMs(2), 600_000)
    assert.equal(nextBackoffMs(3), 3_600_000)
  })

  it("clamps beyond the last step", () => {
    assert.equal(nextBackoffMs(4), ATS_BACKOFF_MS[ATS_BACKOFF_MS.length - 1])
    assert.equal(nextBackoffMs(0), ATS_BACKOFF_MS[0])
  })
})
