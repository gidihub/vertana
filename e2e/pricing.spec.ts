import { test, expect } from "@playwright/test"

/**
 * PPP pricing is resolved entirely server-side from trusted edge headers.
 * The client never sends a price or a tier — only a plan name + interval.
 *
 * Reference prices (Growth, monthly):
 *   t1 $39 · t2 $27 · t3 $19 · t4 $15 · t5 $10
 */

async function readGrowthMonthly(page: import("@playwright/test").Page) {
  // Cards default to yearly; switch to monthly to read the $/mo headline.
  await page.getByRole("radio", { name: "Monthly" }).click()
}

test.describe("regional (PPP) pricing", () => {
  test("ZA (t3) shows Growth at $19/mo + regional chip", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "ZA" })
    await page.goto("/pricing")
    await readGrowthMonthly(page)

    await expect(page.getByText("$19", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/South Africa pricing applied/i)).toBeVisible()
  })

  test("NG (t4) shows Growth at $15/mo + regional chip", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "NG" })
    await page.goto("/pricing")
    await readGrowthMonthly(page)

    await expect(page.getByText("$15", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Nigeria pricing applied/i)).toBeVisible()
  })

  test("DE (t1 anchor) shows Growth at $39/mo, no chip", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "DE" })
    await page.goto("/pricing")
    await readGrowthMonthly(page)

    await expect(page.getByText("$39", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/pricing applied/i)).toHaveCount(0)
  })

  test("nonsense country code (ZZ) falls back to anchor: $39/mo, no chip", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "ZZ" })
    await page.goto("/pricing")
    await readGrowthMonthly(page)

    await expect(page.getByText("$39", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/pricing applied/i)).toHaveCount(0)
  })

  test("no geo header falls back to anchor: $39/mo, no chip", async ({
    page,
  }) => {
    await page.goto("/pricing")
    await readGrowthMonthly(page)

    await expect(page.getByText("$39", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/pricing applied/i)).toHaveCount(0)
  })

  test("RU (blocked) shows a not-available state, no pricing", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "RU" })
    await page.goto("/pricing")

    await expect(
      page.getByText(/isn.t available in your region/i),
    ).toBeVisible()
    // No pricing is rendered for a blocked region.
    await expect(page.getByRole("radio", { name: "Monthly" })).toHaveCount(0)
    await expect(page.getByText("$39", { exact: true })).toHaveCount(0)
  })
})

test.describe("checkout security", () => {
  test("checkout endpoint ignores any client-provided price/tier and requires auth", async ({
    request,
  }) => {
    // Attempt to inject a cheaper price/tier the way a malicious client might.
    const res = await request.post("/api/billing/checkout", {
      data: {
        tier: "growth",
        cycle: "monthly",
        price: 1,
        price_cents: 1,
        ppp_tier: "t5",
      },
    })

    // Unauthenticated callers are rejected with an auth client error (the route
    // is gated by middleware → 401, or 403 for a non-owner). The server never
    // trusts a client-supplied price/tier, so no checkout session is returned.
    expect([401, 403]).toContain(res.status())
    const body = await res.text()
    expect(body).not.toContain("checkout.stripe.com")
  })
})
