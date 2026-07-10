import Stripe from "stripe"

import { getStripeSecretKey, isStripeConfigured } from "@/lib/stripe/env"

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.",
    )
  }

  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      typescript: true,
    })
  }

  return stripeClient
}
