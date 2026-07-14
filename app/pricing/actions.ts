"use server"

import { headers } from "next/headers"

import { requireRecruiter } from "@/lib/auth/recruiter"
import {
  resolvePackPriceId,
  resolvePlanPriceId,
} from "@/lib/billing/catalog"
import { ensureStripeCustomerForOrg } from "@/lib/billing/customer"
import { getOrganizationById } from "@/lib/org"
import { pricingForTier } from "@/lib/pricing/config"
import { resolveTierFromHeaders } from "@/lib/pricing"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import { ensureSubscriberPackCoupon } from "@/lib/stripe/coupons"
import { getSiteUrl, isStripeConfigured } from "@/lib/stripe/env"
import { type PackId } from "@/lib/stripe/prices"

type CheckoutResult = { url: string } | { error: string }

const SUBSCRIPTION_PLANS = new Set(["starter", "growth"])
const PACK_IDS = new Set<PackId>(["pack_50", "pack_200", "pack_500"])
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"])

/**
 * Start a subscription checkout. The client only sends a plan name + interval —
 * never a price or PPP tier. The tier and Stripe Price ID are derived entirely
 * server-side from trusted edge headers, so a spoofed price is impossible.
 */
export async function startSubscription(
  planName: string,
  interval: string,
): Promise<CheckoutResult> {
  if (!SUBSCRIPTION_PLANS.has(planName)) {
    return { error: "Unknown plan" }
  }
  const cycle = interval === "yearly" ? "annual" : "monthly"

  let auth
  try {
    auth = await requireRecruiter()
  } catch {
    return { error: "auth_required" }
  }
  if (auth.role !== "owner") {
    return { error: "Only organization owners can manage billing" }
  }
  if (!isStripeConfigured()) {
    return { error: "Stripe billing is not configured" }
  }

  const tier = resolveTierFromHeaders(await headers())
  const priceId = await resolvePlanPriceId(
    planName as "starter" | "growth",
    tier,
    interval === "yearly" ? "yearly" : "monthly",
  )
  if (!priceId) {
    return { error: `Stripe price is not configured for ${planName}` }
  }

  const email = auth.user.email
  if (!email) return { error: "A verified email is required for checkout" }

  const org = await getOrganizationById(auth.orgId)
  const customerId = await ensureStripeCustomerForOrg({ org, email, name: org.name })

  const siteUrl = getSiteUrl()
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: auth.orgId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/settings?billing=success`,
    cancel_url: `${siteUrl}/pricing?billing=canceled`,
    metadata: {
      org_id: auth.orgId,
      plan_tier: planName,
      billing_cycle: cycle,
      ppp_tier: tier,
    },
    subscription_data: {
      metadata: {
        org_id: auth.orgId,
        plan_tier: planName,
        billing_cycle: cycle,
        ppp_tier: tier,
      },
    },
    allow_promotion_codes: true,
  })

  if (!session.url) return { error: "Failed to create checkout session" }
  return { url: session.url }
}

/**
 * Buy a one-time credit pack. Price + PPP tier are resolved server-side. The
 * 15% subscriber discount is applied via a Stripe coupon only when the org has
 * an active subscription.
 */
export async function buyPack(packName: string): Promise<CheckoutResult> {
  if (!PACK_IDS.has(packName as PackId)) {
    return { error: "Unknown credit pack" }
  }
  const packId = packName as PackId

  let auth
  try {
    auth = await requireRecruiter()
  } catch {
    return { error: "auth_required" }
  }
  if (auth.role !== "owner") {
    return { error: "Only organization owners can manage billing" }
  }
  if (!isStripeConfigured()) {
    return { error: "Stripe billing is not configured" }
  }

  const tier = resolveTierFromHeaders(await headers())
  const priceId = await resolvePackPriceId(packId, tier)
  if (!priceId) {
    return { error: `Stripe price is not configured for ${packName}` }
  }

  const packConfig = pricingForTier(tier).packs.find((p) => p.id === packId)
  if (!packConfig) return { error: "Unknown credit pack" }

  const email = auth.user.email
  if (!email) return { error: "A verified email is required for checkout" }

  const org = await getOrganizationById(auth.orgId)
  const customerId = await ensureStripeCustomerForOrg({ org, email, name: org.name })

  // Resolve the catalog row id for the ledger (credit_pack_id). A missing row
  // means the catalog isn't seeded for this pack/tier — refuse rather than
  // create a purchase we can't attribute.
  const admin = createAdminClient()
  const { data: packRow } = await admin
    .from("credit_packs")
    .select("id")
    .eq("name", packId)
    .eq("tier", tier)
    .maybeSingle()
  if (!packRow?.id) {
    return { error: `Credit pack is not available for ${packName}` }
  }

  // The 15% discount requires a genuinely active Stripe subscription — not just
  // a non-free plan_tier (which can be stale after cancellation or set manually).
  const isSubscriber =
    !!org.stripe_subscription_id &&
    ACTIVE_STATUSES.has(org.subscription_status ?? "")

  const discounts = isSubscriber
    ? [{ coupon: await ensureSubscriberPackCoupon() }]
    : undefined

  const metadata = {
    org_id: auth.orgId,
    kind: "credit_pack",
    pack_name: packId,
    pack_tier: tier,
    credit_pack_id: packRow.id,
    credits: String(packConfig.credits),
  }

  const siteUrl = getSiteUrl()
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: auth.orgId,
    line_items: [{ price: priceId, quantity: 1 }],
    discounts,
    success_url: `${siteUrl}/settings?billing=pack_success`,
    cancel_url: `${siteUrl}/pricing?billing=canceled`,
    metadata,
    payment_intent_data: { metadata },
  })

  if (!session.url) return { error: "Failed to create checkout session" }
  return { url: session.url }
}
