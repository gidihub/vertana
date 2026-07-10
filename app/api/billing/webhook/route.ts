import { NextResponse } from "next/server"

import { handleStripeWebhookEvent } from "@/lib/billing/webhook"
import { getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe/env"
import { getStripe } from "@/lib/stripe/client"

export const runtime = "nodejs"

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe billing is not configured" },
      { status: 503 },
    )
  }

  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured" },
      { status: 503 },
    )
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
  }

  const body = await req.text()

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[billing/webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    await handleStripeWebhookEvent(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[billing/webhook] Handler failed:", err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
