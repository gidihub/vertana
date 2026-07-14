import { getStripe } from "@/lib/stripe/client"
import { SUBSCRIBER_PACK_DISCOUNT } from "@/lib/pricing/config"

/**
 * Stable coupon id for the 15% subscriber pack discount. Created once,
 * idempotently, and reused for every eligible checkout.
 */
const SUBSCRIBER_COUPON_ID = "vertana_subscriber_pack_15"

/**
 * Ensure the subscriber pack coupon exists in Stripe and return its id.
 * Applied only when the buying org has an active subscription.
 */
function stripeErrorCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? (err as { code?: string }).code
    : undefined
}

export async function ensureSubscriberPackCoupon(): Promise<string> {
  const stripe = getStripe()
  try {
    const existing = await stripe.coupons.retrieve(SUBSCRIBER_COUPON_ID)
    if (existing && !("deleted" in existing && existing.deleted)) {
      return SUBSCRIBER_COUPON_ID
    }
  } catch (err) {
    // Only "not found" means we should create it. Authentication, network,
    // rate-limit, and other failures must propagate rather than silently
    // triggering a create that will also fail.
    if (stripeErrorCode(err) !== "resource_missing") throw err
  }

  try {
    const coupon = await stripe.coupons.create({
      id: SUBSCRIBER_COUPON_ID,
      percent_off: SUBSCRIBER_PACK_DISCOUNT * 100,
      duration: "forever",
      name: "Subscriber pack discount",
    })
    return coupon.id
  } catch (err) {
    // A concurrent request created the coupon first — that's fine, use it.
    if (stripeErrorCode(err) === "resource_already_exists") {
      return SUBSCRIBER_COUPON_ID
    }
    throw err
  }
}
