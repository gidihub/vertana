import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { getOrganization } from "@/lib/org"
import { getSiteUrl, isStripeConfigured } from "@/lib/stripe/env"
import { getStripe } from "@/lib/stripe/client"
import { ensureStripeCustomerForOrg } from "@/lib/billing/customer"

export async function POST() {
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

    const org = await getOrganization()
    const email = user.email
    if (!email) {
      return NextResponse.json(
        { error: "A verified email is required for billing portal" },
        { status: 400 },
      )
    }

    const customerId =
      org.stripe_customer_id ??
      (await ensureStripeCustomerForOrg({ org, email, name: org.name }))

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getSiteUrl()}/settings`,
    })

    return NextResponse.json({ url: session.url })
  })
}
