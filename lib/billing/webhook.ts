import type Stripe from "stripe"

import {
  downgradeOrgToFree,
  markWebhookEventProcessed,
  syncSubscriptionToOrg,
  wasWebhookEventProcessed,
} from "@/lib/billing/sync"
import {
  getOrganizationByStripeCustomerId,
  getOrganizationByStripeSubscriptionId,
} from "@/lib/billing/customer"
import { recordPackPurchase } from "@/lib/credits/ledger"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import type { OrganizationRow } from "@/lib/db/mappers"

async function resolveOrgFromSubscription(
  subscription: Stripe.Subscription,
): Promise<OrganizationRow | null> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id

  if (customerId) {
    const byCustomer = await getOrganizationByStripeCustomerId(customerId)
    if (byCustomer) return byCustomer
  }

  return getOrganizationByStripeSubscriptionId(subscription.id)
}

async function resolveOrgFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<OrganizationRow | null> {
  const orgId = session.metadata?.org_id ?? session.client_reference_id
  if (orgId) {
    const admin = createAdminClient()
    const { data } = await admin
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .maybeSingle()
    if (data) return data as OrganizationRow
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id

  if (customerId) {
    return getOrganizationByStripeCustomerId(customerId)
  }

  return null
}

export async function handleStripeWebhookEvent(
  event: Stripe.Event,
): Promise<void> {
  if (await wasWebhookEventProcessed(event.id)) return

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      // One-time credit-pack purchase.
      if (session.mode === "payment" && session.metadata?.kind === "credit_pack") {
        const org = await resolveOrgFromCheckoutSession(session)
        if (!org) {
          console.error(
            "[billing] credit-pack purchase paid but org could not be resolved — manual reconciliation required",
            {
              sessionId: session.id,
              orgId: session.metadata?.org_id ?? session.client_reference_id,
              customer:
                typeof session.customer === "string"
                  ? session.customer
                  : (session.customer?.id ?? null),
              metadata: session.metadata,
            },
          )
          break
        }

        const credits = Number.parseInt(session.metadata.credits ?? "0", 10)
        if (!Number.isFinite(credits) || credits <= 0) {
          console.error(
            "[billing] credit-pack purchase paid but credit amount is invalid — manual reconciliation required",
            {
              sessionId: session.id,
              orgId: org.id,
              rawCredits: session.metadata.credits ?? null,
              metadata: session.metadata,
            },
          )
          break
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null)

        await recordPackPurchase({
          orgId: org.id,
          creditPackId: session.metadata.credit_pack_id || null,
          credits,
          pricePaidCents: session.amount_total ?? 0,
          // Fall back to the (unique) checkout session id so a duplicate webhook
          // delivery can't double-credit even when payment_intent is absent.
          stripePaymentIntentId: paymentIntentId ?? session.id,
        })
        break
      }

      if (session.mode !== "subscription" || !session.subscription) break

      const org = await resolveOrgFromCheckoutSession(session)
      if (!org) break

      const stripe = getStripe()
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      await syncSubscriptionToOrg(org, subscription)
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const org = await resolveOrgFromSubscription(subscription)
      if (!org) break
      await syncSubscriptionToOrg(org, subscription)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const org = await resolveOrgFromSubscription(subscription)
      if (!org) break
      await downgradeOrgToFree(org.id)
      break
    }

    default:
      break
  }

  await markWebhookEventProcessed(event)
}
