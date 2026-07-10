import type Stripe from "stripe"

import { creditsForTier, type PlanTier } from "@/lib/plans"
import { createAdminClient } from "@/lib/supabase/admin"
import type { OrganizationRow } from "@/lib/db/mappers"
import {
  billingCycleFromPriceId,
  tierFromPriceId,
} from "@/lib/stripe/prices"
import { subscriptionPeriodEnd, subscriptionPriceId } from "@/lib/billing/customer"

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
])

export function planTierFromSubscription(
  subscription: Stripe.Subscription,
): PlanTier | null {
  const priceId = subscriptionPriceId(subscription)
  if (!priceId) return null
  return tierFromPriceId(priceId)
}

export async function applyPlanTierToOrg(
  orgId: string,
  tier: PlanTier,
  options?: { resetCredits?: boolean },
): Promise<void> {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = { plan_tier: tier }
  if (options?.resetCredits) {
    patch.credits_remaining = creditsForTier(tier)
  }

  const { error } = await admin.from("organizations").update(patch).eq("id", orgId)
  if (error) {
    throw new Error(`Failed to update plan tier: ${error.message}`)
  }
}

export async function syncSubscriptionToOrg(
  org: OrganizationRow,
  subscription: Stripe.Subscription,
): Promise<void> {
  const priceId = subscriptionPriceId(subscription)
  const tier = priceId ? tierFromPriceId(priceId) : null
  const billingCycle = priceId ? billingCycleFromPriceId(priceId) : null
  const isActive = ACTIVE_STATUSES.has(subscription.status)

  const admin = createAdminClient()
  const { error } = await admin
    .from("organizations")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      billing_cycle: billingCycle,
      current_period_end: subscriptionPeriodEnd(subscription),
      ...(isActive && tier
        ? {
            plan_tier: tier,
            credits_remaining: creditsForTier(tier),
          }
        : {
            plan_tier: "free",
          }),
    })
    .eq("id", org.id)

  if (error) {
    throw new Error(`Failed to sync subscription: ${error.message}`)
  }
}

export async function downgradeOrgToFree(orgId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("organizations")
    .update({
      plan_tier: "free",
      stripe_subscription_id: null,
      subscription_status: "canceled",
      billing_cycle: null,
      current_period_end: null,
      credits_remaining: creditsForTier("free"),
    })
    .eq("id", orgId)

  if (error) {
    throw new Error(`Failed to downgrade organization: ${error.message}`)
  }
}

export async function wasWebhookEventProcessed(eventId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to check webhook event: ${error.message}`)
  }

  return Boolean(data)
}

export async function markWebhookEventProcessed(event: Stripe.Event): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
  })

  if (!error) return
  if (error.code === "23505") return
  throw new Error(`Failed to record webhook event: ${error.message}`)
}
