import { headers } from "next/headers"
import Link from "next/link"

import { PricingPlans } from "@/components/marketing/pricing-plans"
import { CurrencyProvider } from "@/components/marketing/currency-context"
import { getPricingForRequest } from "@/lib/pricing"
import { countryName } from "@/lib/billing/ppp"
import { defaultCurrencyForCountry } from "@/lib/pricing/currency"
import { PLAN_ORDER } from "@/lib/pricing/presentation"

export async function Pricing() {
  const pricing = getPricingForRequest(await headers())

  if (pricing.blocked) {
    return (
      <section id="pricing" className="border-b border-sage-line/70 bg-paper">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Not available in your region
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
            We can&rsquo;t currently offer Vertana in your country due to payment
            and sanctions restrictions.{" "}
            <Link
              href="mailto:sales@vertana.com"
              className="font-medium text-pine underline-offset-2 hover:underline"
            >
              Get in touch
            </Link>{" "}
            if you think this is a mistake.
          </p>
        </div>
      </section>
    )
  }

  const plans = PLAN_ORDER.map((name) => pricing.plans[name])
  const regionLabel = pricing.isRegional ? countryName(pricing.country) : null
  const defaultCurrency = defaultCurrencyForCountry(pricing.country)

  return (
    <section id="pricing" className="border-b border-sage-line/70 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Pricing
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Flat pricing. No per-seat charges.
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            Every plan includes a generous seat count — you only pay for the
            candidates you evaluate.
          </p>
        </div>

        <CurrencyProvider defaultCurrency={defaultCurrency}>
          <PricingPlans plans={plans} regionLabel={regionLabel} />
        </CurrencyProvider>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Need more? Buy credit packs on any plan — no subscription required.{" "}
          <Link
            href="/pricing"
            className="font-medium text-pine underline-offset-2 hover:underline"
          >
            See full pricing
          </Link>
        </p>
      </div>
    </section>
  )
}
