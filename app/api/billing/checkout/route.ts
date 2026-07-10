import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { ensureStripeCustomerForOrg } from "@/lib/billing/customer"
import { getOrganization } from "@/lib/org"
import { getSiteUrl, isStripeConfigured } from "@/lib/stripe/env"
import { getStripe } from "@/lib/stripe/client"
import { priceIdForTier } from "@/lib/stripe/prices"

const checkoutSchema = z.object({
  tier: z.enum(["starter", "growth"]),
  cycle: z.enum(["monthly", "annual"]).default("monthly"),
})

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, user, role }) => {
    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can manage billing" },
        { status: 403 },
      )
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe billing is not configured" },
        { status: 503 },
      )
    }

    try {
      const body = checkoutSchema.parse(await req.json())
      const priceId = priceIdForTier(body.tier, body.cycle)
      if (!priceId) {
        return NextResponse.json(
          {
            error: `Stripe price is not configured for ${body.tier} (${body.cycle})`,
          },
          { status: 503 },
        )
      }

      const org = await getOrganization()
      const email = user.email
      if (!email) {
        return NextResponse.json(
          { error: "A verified email is required for checkout" },
          { status: 400 },
        )
      }

      const customerId = await ensureStripeCustomerForOrg({
        org,
        email,
        name: org.name,
      })

      const siteUrl = getSiteUrl()
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: orgId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${siteUrl}/settings?billing=success`,
        cancel_url: `${siteUrl}/settings?billing=canceled`,
        metadata: {
          org_id: orgId,
          plan_tier: body.tier,
          billing_cycle: body.cycle,
        },
        subscription_data: {
          metadata: {
            org_id: orgId,
            plan_tier: body.tier,
            billing_cycle: body.cycle,
          },
        },
        allow_promotion_codes: true,
      })

      if (!session.url) {
        return NextResponse.json(
          { error: "Failed to create checkout session" },
          { status: 500 },
        )
      }

      return NextResponse.json({ url: session.url })
    } catch (err) {
      console.error("[checkout] failed to create session:", err)
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
      }
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      )
    }
  })
}
