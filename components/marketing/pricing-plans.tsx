"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check, Globe, Users } from "lucide-react"
import { toast } from "sonner"

import { startSubscription } from "@/app/pricing/actions"
import type { BillingInterval, PlanConfig } from "@/lib/pricing/config"
import { displayPriceCents } from "@/lib/pricing"
import {
  buyerLine,
  ctaLabel,
  headlinePrice,
  planFeatureBullets,
  seatsBadgeLabel,
  secondaryPriceLine,
} from "@/lib/pricing/presentation"
import { formatLocalEstimate } from "@/lib/pricing/currency"
import {
  CurrencyNote,
  CurrencyPicker,
  useCurrency,
} from "@/components/marketing/currency-context"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

const CONTACT_HREF = "mailto:sales@vertana.com"

export function PricingPlans({
  plans,
  regionLabel = null,
}: {
  plans: PlanConfig[]
  /** Detected country name for the regional pricing chip; null on the anchor tier. */
  regionLabel?: string | null
}) {
  const [interval, setInterval] = useState<BillingInterval>("yearly")

  return (
    <div>
      <div className="mt-8 flex flex-col items-center gap-3 sm:relative sm:flex-row sm:justify-center">
        <BillingToggle interval={interval} onChange={setInterval} />
        <div className="sm:absolute sm:right-0">
          <CurrencyPicker />
        </div>
      </div>

      <CurrencyNote className="mt-3" />

      {regionLabel ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-ink-muted">
          <Globe className="size-4 shrink-0" aria-hidden />
          {regionLabel} pricing applied
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} interval={interval} />
        ))}
      </div>
    </div>
  )
}

function BillingToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval
  onChange: (interval: BillingInterval) => void
}) {
  const isYearly = interval === "yearly"
  return (
    <div className="flex items-center justify-center">
      <div
        role="radiogroup"
        aria-label="Billing interval"
        className="inline-flex items-center rounded-full border border-sage-line bg-card p-1"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!isYearly}
          onClick={() => onChange("monthly")}
          className={
            !isYearly
              ? "rounded-full bg-pine px-4 py-2 text-sm font-semibold text-pine-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              : "rounded-full px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          }
        >
          Monthly
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isYearly}
          onClick={() => onChange("yearly")}
          className={
            isYearly
              ? "flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-pine-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              : "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          }
        >
          Yearly
          <span
            className={
              isYearly
                ? "rounded-full bg-lime px-2 py-0.5 text-xs font-semibold text-lime-ink"
                : "rounded-full bg-lime/60 px-2 py-0.5 text-xs font-semibold text-lime-ink"
            }
          >
            Save over 30%
          </span>
        </button>
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  interval,
}: {
  plan: PlanConfig
  interval: BillingInterval
}) {
  const { currency } = useCurrency()
  const featured = plan.name === "growth"
  const usdPrice = headlinePrice(plan, interval)
  const secondary = secondaryPriceLine(plan, interval)
  const showCadence = plan.name !== "custom"
  // Local currency (pegged to USD) is the headline; USD is shown underneath.
  const cents = displayPriceCents(plan, interval)
  const local = formatLocalEstimate(cents, currency)
  const price = local ?? usdPrice
  // Only peg a USD line for paid plans — no "= $0 USD" under Free.
  const usdPeg = local && cents != null && cents > 0 ? usdPrice : null
  // Long localized amounts (e.g. "USh102,600") overflow the card, so scale down.
  const priceSizeClass =
    price.length >= 10 ? "text-2xl" : price.length >= 8 ? "text-3xl" : "text-4xl"

  return (
    <div
      className={
        featured
          ? "relative flex flex-col rounded-2xl border-2 border-pine bg-card p-7 shadow-[0_24px_60px_-34px_rgba(14,74,52,0.55)]"
          : "relative flex flex-col rounded-2xl border border-sage-line bg-card p-7"
      }
    >
      {featured ? (
        <span className="absolute -top-3 left-7 rounded-full bg-lime px-3 py-1 text-xs font-semibold text-lime-ink">
          Most popular
        </span>
      ) : null}

      <h3 className="text-lg font-semibold text-ink capitalize">{plan.name}</h3>

      <div className="mt-3 flex min-w-0 items-baseline gap-1.5">
        <span
          className={cn(
            "font-semibold text-ink whitespace-nowrap",
            priceSizeClass,
            numericText,
          )}
        >
          {price}
        </span>
        {showCadence ? (
          <span className="text-sm text-ink-muted">/mo</span>
        ) : null}
      </div>
      {usdPeg ? (
        <p className={cn("mt-1 text-xs text-ink-muted", numericText)}>
          = {usdPeg} USD{showCadence ? "/mo" : ""}
        </p>
      ) : null}
      <p className="mt-1 h-4 text-xs text-ink-muted">{secondary}</p>

      <p className="mt-2 text-sm text-ink-muted">{buyerLine(plan.name)}</p>

      <div className="mt-5 flex items-center gap-2 rounded-lg bg-pine/10 px-3 py-2.5 text-sm font-semibold text-pine">
        <Users className="size-4 shrink-0" aria-hidden />
        {seatsBadgeLabel(plan)}
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {planFeatureBullets(plan).map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
              <Check className="size-3" aria-hidden />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PlanCta plan={plan} interval={interval} featured={featured} />
      </div>
    </div>
  )
}

function PlanCta({
  plan,
  interval,
  featured,
}: {
  plan: PlanConfig
  interval: BillingInterval
  featured: boolean
}) {
  const [pending, startTransition] = useTransition()

  const primaryClasses = featured
    ? "inline-flex w-full items-center justify-center rounded-full bg-pine px-5 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-60"
    : "inline-flex w-full items-center justify-center rounded-full border border-sage-line px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-60"

  if (plan.name === "free") {
    return (
      <Link href="/signup" className={primaryClasses}>
        {ctaLabel(plan.name)}
      </Link>
    )
  }

  if (plan.name === "custom") {
    return (
      <Link href={CONTACT_HREF} className={primaryClasses}>
        {ctaLabel(plan.name)}
      </Link>
    )
  }

  const onClick = () => {
    startTransition(async () => {
      const result = await startSubscription(plan.name, interval)
      if ("url" in result) {
        window.location.assign(result.url)
        return
      }
      if (result.error === "auth_required") {
        window.location.assign("/signup")
        return
      }
      toast.error(result.error)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={primaryClasses}
    >
      {pending ? "Redirecting…" : ctaLabel(plan.name)}
    </button>
  )
}
