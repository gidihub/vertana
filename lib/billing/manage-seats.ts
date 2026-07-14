import type Stripe from "stripe"

import { ANCHOR_TIER, type PppTier } from "@/lib/billing/ppp"
import {
  extraSeatPriceIds,
  resolveExtraSeatPriceId,
} from "@/lib/billing/catalog"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import type { OrganizationRow } from "@/lib/db/mappers"

export class SeatChangeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SeatChangeError"
  }
}

/**
 * Extra-seat quantity currently on the Stripe subscription (from the extra-seat
 * line item). Returns 0 when there is no extra-seat item.
 */
export async function extraSeatQuantityFromSubscription(
  subscription: Stripe.Subscription,
): Promise<number> {
  const ids = await extraSeatPriceIds()
  if (ids.size === 0) return 0
  const item = subscription.items.data.find(
    (i) => i.price?.id && ids.has(i.price.id),
  )
  return item?.quantity ?? 0
}

/**
 * Set the org's extra-seat count to `quantity`.
 *
 * The seat total is persisted first via a row-locked RPC that recomputes usage
 * under the same lock create_team_invite_atomic takes, so concurrent invites
 * cannot admit seats against a stale snapshot and a decrease can never leave used
 * seats above the persisted total. The Stripe subscription line item is then
 * updated to match; if that fails, the persisted count is reverted so the
 * database (which gates invite creation) stays consistent with billing.
 *
 * Increases are prorated immediately; decreases take effect without an immediate
 * credit (next invoice). Cannot reduce total seats below current usage.
 */
export async function setExtraSeats(
  org: OrganizationRow,
  quantity: number,
): Promise<number> {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new SeatChangeError("Seat count must be a whole number of 0 or more.")
  }
  if (quantity > 100) {
    throw new SeatChangeError("Contact sales for more than 100 extra seats.")
  }
  if (!org.stripe_subscription_id) {
    throw new SeatChangeError(
      "Add a paid plan before purchasing extra seats.",
    )
  }

  const tier = (org.ppp_tier as PppTier | null) ?? ANCHOR_TIER
  const extraSeatPriceId = await resolveExtraSeatPriceId(tier)
  if (!extraSeatPriceId) {
    throw new SeatChangeError(
      "Extra seats aren't configured yet. Run the Stripe setup script.",
    )
  }

  const admin = createAdminClient()

  // Validate usage and persist the new count atomically under a row lock.
  const { data: previousExtraSeats, error: rpcError } = await admin.rpc(
    "set_extra_seats_atomic",
    { p_org_id: org.id, p_extra_seats: quantity },
  )
  if (rpcError) {
    const belowUsage = rpcError.message?.match(/seat_below_usage_(\d+)_(\d+)/)
    if (belowUsage) {
      const newTotal = Number(belowUsage[1])
      const used = Number(belowUsage[2])
      throw new SeatChangeError(
        `You have ${used} members/invites. Remove some before reducing to ${newTotal} seats.`,
      )
    }
    throw new SeatChangeError(`Failed to save seat count: ${rpcError.message}`)
  }

  // Mirror the persisted count onto Stripe. Revert on failure to keep the DB
  // (the invite-enforcement source of truth) consistent with billing.
  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(
      org.stripe_subscription_id,
    )
    const existing = subscription.items.data.find(
      (i) => i.price?.id === extraSeatPriceId,
    )
    const currentQty = existing?.quantity ?? 0
    const increasing = quantity > currentQty
    const proration_behavior: Stripe.SubscriptionItemUpdateParams["proration_behavior"] =
      increasing ? "create_prorations" : "none"

    if (quantity === 0) {
      if (existing) {
        await stripe.subscriptionItems.del(existing.id, {
          proration_behavior: "none",
        })
      }
    } else if (existing) {
      await stripe.subscriptionItems.update(existing.id, {
        quantity,
        proration_behavior,
      })
    } else {
      await stripe.subscriptionItems.create({
        subscription: org.stripe_subscription_id,
        price: extraSeatPriceId,
        quantity,
        proration_behavior,
      })
    }
  } catch (err) {
    const stripeMessage = (err as Error).message
    // Revert through the same row-locked RPC (not a bare update) so the restore
    // still recomputes usage under lock and can't race concurrent invites.
    const { error: revertError } = await admin.rpc("set_extra_seats_atomic", {
      p_org_id: org.id,
      p_extra_seats: previousExtraSeats ?? 0,
    })
    if (revertError) {
      throw new SeatChangeError(
        `Failed to update seats in Stripe: ${stripeMessage}. ` +
          `Reverting the saved seat count also failed: ${revertError.message}. ` +
          `Seat billing may be out of sync — please retry.`,
      )
    }
    throw new SeatChangeError(
      `Failed to update seats in Stripe: ${stripeMessage}`,
    )
  }

  return quantity
}
