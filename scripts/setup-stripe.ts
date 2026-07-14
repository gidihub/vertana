/**
 * Idempotent Stripe provisioning from the pricing config (the single source of
 * truth). Creates/updates:
 *   - one Product per subscription plan per PPP tier (Starter, Growth)
 *   - monthly + yearly recurring Prices for each
 *   - one Product + one-time Price per credit pack per PPP tier
 *   - the 15% subscriber pack coupon
 * and writes the resulting Stripe Price IDs into the plans / credit_packs tables.
 *
 * Run (after applying migrations 021–024):
 *   node --experimental-strip-types --import ./scripts/resolve-ts-alias.mjs scripts/setup-stripe.ts
 * or: pnpm setup:stripe
 *
 * Uses whatever STRIPE_SECRET_KEY is set (a test-mode key provisions test mode).
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Safe to re-run: existing
 * products/prices/coupons are reused; only changed amounts create new prices.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

import { PRICING_BY_TIER, SUBSCRIBER_PACK_DISCOUNT } from "@/lib/pricing/config"
import type { PppTier } from "@/lib/billing/ppp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

function loadEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const i = line.indexOf("=")
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
      }),
  )
}

const env = { ...loadEnv(path.join(root, ".env.local")), ...process.env }

const stripeKey = env.STRIPE_SECRET_KEY
const supabaseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!stripeKey) {
  console.error("Missing STRIPE_SECRET_KEY (use a test-mode key for test mode).")
  process.exit(1)
}
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(1)
}

const stripe = new Stripe(stripeKey)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

const mode = stripeKey.startsWith("sk_live") ? "LIVE" : "TEST"

function stripeErrorCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? (err as { code?: string }).code
    : undefined
}

async function ensureProduct(id: string, name: string): Promise<string> {
  try {
    const existing = await stripe.products.retrieve(id)
    if (existing?.id) return existing.id
  } catch (err) {
    if (stripeErrorCode(err) !== "resource_missing") throw err
  }
  const created = await stripe.products.create({ id, name })
  return created.id
}

async function ensurePrice(opts: {
  product: string
  unitAmount: number
  lookupKey: string
  recurring?: Stripe.PriceCreateParams.Recurring
}): Promise<string> {
  const { data } = await stripe.prices.list({
    lookup_keys: [opts.lookupKey],
    limit: 1,
  })
  const found = data[0]

  const matches =
    found &&
    found.active &&
    found.unit_amount === opts.unitAmount &&
    found.currency === "usd" &&
    (opts.recurring
      ? found.recurring?.interval === opts.recurring.interval
      : !found.recurring)

  if (matches) return found.id

  const created = await stripe.prices.create({
    product: opts.product,
    currency: "usd",
    unit_amount: opts.unitAmount,
    lookup_key: opts.lookupKey,
    transfer_lookup_key: Boolean(found),
    ...(opts.recurring ? { recurring: opts.recurring } : {}),
  })
  return created.id
}

async function ensureCoupon(): Promise<string> {
  const id = "vertana_subscriber_pack_15"
  try {
    const existing = await stripe.coupons.retrieve(id)
    if (existing?.id) return id
  } catch (err) {
    if (stripeErrorCode(err) !== "resource_missing") throw err
  }
  try {
    await stripe.coupons.create({
      id,
      percent_off: SUBSCRIBER_PACK_DISCOUNT * 100,
      duration: "forever",
      name: "Subscriber pack discount",
    })
  } catch (err) {
    if (stripeErrorCode(err) !== "resource_already_exists") throw err
  }
  return id
}

async function main() {
  console.log(`Provisioning Stripe (${mode} mode)…\n`)

  const tiers = Object.keys(PRICING_BY_TIER) as PppTier[]

  for (const tier of tiers) {
    const { plans, packs } = PRICING_BY_TIER[tier]

    for (const planName of ["starter", "growth"] as const) {
      const plan = plans[planName]
      if (plan.monthlyPriceCents == null || plan.yearlyPriceCents == null) continue

      const product = await ensureProduct(
        `vertana_${planName}_${tier}`,
        `Vertana ${planName[0].toUpperCase()}${planName.slice(1)} (${tier})`,
      )

      const monthlyPriceId = await ensurePrice({
        product,
        unitAmount: plan.monthlyPriceCents,
        lookupKey: `plan_${planName}_${tier}_monthly`,
        recurring: { interval: "month" },
      })
      const yearlyPriceId = await ensurePrice({
        product,
        unitAmount: plan.yearlyPriceCents,
        lookupKey: `plan_${planName}_${tier}_yearly`,
        recurring: { interval: "year" },
      })

      const { error } = await supabase
        .from("plans")
        .update({
          stripe_monthly_price_id: monthlyPriceId,
          stripe_yearly_price_id: yearlyPriceId,
        })
        .eq("name", planName)
        .eq("tier", tier)
      if (error) throw new Error(`DB update failed (${planName}/${tier}): ${error.message}`)

      console.log(
        `  ${planName}/${tier}: monthly=${monthlyPriceId} yearly=${yearlyPriceId}`,
      )
    }

    for (const pack of packs) {
      const product = await ensureProduct(
        `vertana_${pack.id}_${tier}`,
        `Vertana ${pack.credits} credits (${tier})`,
      )
      const priceId = await ensurePrice({
        product,
        unitAmount: pack.priceCents,
        lookupKey: `${pack.id}_${tier}`,
      })

      const { error } = await supabase
        .from("credit_packs")
        .update({ stripe_price_id: priceId })
        .eq("name", pack.id)
        .eq("tier", tier)
      if (error) throw new Error(`DB update failed (${pack.id}/${tier}): ${error.message}`)

      console.log(`  ${pack.id}/${tier}: ${priceId}`)
    }

    // Extra seat: one recurring monthly price per tier, written to the paid plan rows.
    const extraSeatCents = plans.growth.extraSeatMonthlyCents
    if (extraSeatCents != null) {
      const product = await ensureProduct(
        `vertana_extra_seat_${tier}`,
        `Vertana extra seat (${tier})`,
      )
      const extraSeatPriceId = await ensurePrice({
        product,
        unitAmount: extraSeatCents,
        lookupKey: `extra_seat_${tier}`,
        recurring: { interval: "month" },
      })

      const { error } = await supabase
        .from("plans")
        .update({ stripe_extra_seat_price_id: extraSeatPriceId })
        .in("name", ["starter", "growth"])
        .eq("tier", tier)
      if (error) throw new Error(`DB update failed (extra_seat/${tier}): ${error.message}`)

      console.log(`  extra_seat/${tier}: ${extraSeatPriceId}`)
    }
  }

  const couponId = await ensureCoupon()
  console.log(`\nSubscriber coupon: ${couponId}`)
  console.log("\nDone. Stripe prices provisioned and written to the DB.")
}

main().catch((err) => {
  console.error("\nStripe setup failed:", err instanceof Error ? err.message : err)
  process.exit(1)
})
