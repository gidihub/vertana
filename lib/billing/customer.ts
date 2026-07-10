import type Stripe from "stripe"

import { createAdminClient } from "@/lib/supabase/admin"
import type { OrganizationRow } from "@/lib/db/mappers"
import { getStripe } from "@/lib/stripe/client"

export async function ensureStripeCustomerForOrg(input: {
  org: OrganizationRow
  email: string
  name?: string
}): Promise<string> {
  if (input.org.stripe_customer_id) {
    return input.org.stripe_customer_id
  }

  const stripe = getStripe()
  const customer = await stripe.customers.create(
    {
      email: input.email,
      name: input.name?.trim() || input.org.name,
      metadata: {
        org_id: input.org.id,
      },
    },
    { idempotencyKey: `stripe-customer-org-${input.org.id}` },
  )

  const admin = createAdminClient()
  const { error } = await admin
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", input.org.id)

  if (error) {
    throw new Error(`Failed to save Stripe customer: ${error.message}`)
  }

  return customer.id
}

export async function getOrganizationByStripeCustomerId(
  customerId: string,
): Promise<OrganizationRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organizations")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`)
  }

  return (data as OrganizationRow | null) ?? null
}

export async function getOrganizationByStripeSubscriptionId(
  subscriptionId: string,
): Promise<OrganizationRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("organizations")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`)
  }

  return (data as OrganizationRow | null) ?? null
}

export function subscriptionPriceId(
  subscription: Stripe.Subscription,
): string | null {
  const item = subscription.items.data[0]
  return item?.price?.id ?? null
}

export function subscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): string | null {
  const itemEnd = subscription.items.data[0]?.current_period_end
  const endSeconds =
    typeof itemEnd === "number"
      ? itemEnd
      : (subscription as Stripe.Subscription & { current_period_end?: number })
          .current_period_end
  if (typeof endSeconds !== "number") return null
  return new Date(endSeconds * 1000).toISOString()
}
