import { Fragment } from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { Check } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { SiteFooter } from "@/components/marketing/site-footer"
import { PricingPlans } from "@/components/marketing/pricing-plans"
import { PricingPacks } from "@/components/marketing/pricing-packs"
import {
  formatPerCandidate,
  formatUsd,
  getPricingForRequest,
  perCandidateCost,
} from "@/lib/pricing"
import { countryName } from "@/lib/billing/ppp"
import { defaultCurrencyForCountry } from "@/lib/pricing/currency"
import { CurrencyProvider } from "@/components/marketing/currency-context"
import { PLAN_ORDER } from "@/lib/pricing/presentation"
import type { PackConfig, PlanConfig } from "@/lib/pricing/config"
import { cn } from "@/lib/utils"
import { numericText } from "@/lib/design-tokens"

export const metadata: Metadata = {
  title: "Pricing — no-shows don't cost you credits | Vertana",
  description:
    "The full toolkit on every paid plan, no per-seat pricing, and 10 free candidates a month. Coding assessments and AI question generation on every plan, including Free.",
  alternates: { canonical: "/pricing" },
}

export default async function PricingPage() {
  const pricing = getPricingForRequest(await headers())

  if (pricing.blocked) {
    return (
      <div className="min-h-svh bg-paper font-sans text-ink">
        <MarketingNav />
        <BlockedRegion />
        <SiteFooter />
      </div>
    )
  }

  const plans = PLAN_ORDER.map((name) => pricing.plans[name])
  const growth = pricing.plans.growth
  const regionLabel = pricing.isRegional ? countryName(pricing.country) : null
  const defaultCurrency = defaultCurrencyForCountry(pricing.country)

  return (
    <div className="min-h-svh bg-paper font-sans text-ink">
      <MarketingNav />
      <main id="main">
        <Headline />

        <CurrencyProvider defaultCurrency={defaultCurrency}>
          <section className="border-b border-sage-line/70 bg-paper">
            <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
              <PricingPlans plans={plans} regionLabel={regionLabel} />
              <PerCandidateStrip growth={growth} />
            </div>
          </section>

          <HowCreditsWork />
          <CreditPacksSection packs={pricing.packs} />
        </CurrencyProvider>

        <ComparisonTable plans={plans} />
        <PricingFaq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  )
}

function BlockedRegion() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[60svh] w-full max-w-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6"
    >
      <h1 className="font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
        Vertana isn&rsquo;t available in your region
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base text-ink-muted">
        We can&rsquo;t currently offer Vertana in your country due to payment and
        sanctions restrictions. If you think this is a mistake, get in touch and
        we&rsquo;ll take a look.
      </p>
      <Link
        href="mailto:sales@vertana.com"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-pine px-6 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Contact us
      </Link>
    </main>
  )
}

function Headline() {
  return (
    <section className="bg-paper">
      <div className="mx-auto w-full max-w-3xl px-4 pt-16 text-center sm:px-6 lg:pt-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-pine">
          Pricing
        </p>
        <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
          No-shows don&rsquo;t cost you credits.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted">
          Full toolkit on every paid plan, no per-seat pricing, 10 free candidates a
          month.
        </p>
      </div>
    </section>
  )
}

function PerCandidateStrip({ growth }: { growth: PlanConfig }) {
  const cost = perCandidateCost(growth)
  if (cost == null) return null
  return (
    <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-sage-line bg-card px-6 py-6 text-center">
      <p className="text-base text-ink">
        Growth works out to{" "}
        <span className={cn("font-semibold text-pine", numericText)}>
          {formatPerCandidate(cost)}
        </span>{" "}
        per candidate. Comparable tools charge $0.50 to $20 per candidate — and
        cap your team size on top.
      </p>
    </div>
  )
}

function HowCreditsWork() {
  const steps = [
    {
      title: "Create tests",
      body: "Build or AI-generate as many tests as your plan allows, with any question type including the coding IDE. Zero credits.",
    },
    {
      title: "Invite candidates",
      body: "Send as many invites as you like. Zero credits — an invite that's never opened never costs you anything.",
    },
    {
      title: "Credits count on completion",
      body: "1 credit when a candidate submits their assessment. That's it.",
    },
  ]
  return (
    <section className="border-b border-sage-line/70 bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center font-sans text-3xl font-semibold tracking-tight text-ink">
          How candidate credits work
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-sage-line bg-paper p-6"
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full bg-pine text-sm font-semibold text-pine-foreground",
                  numericText,
                )}
              >
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-ink-muted">
          Proctored assessments work differently: because recording starts the
          moment the candidate begins, a proctored attempt uses its 2 credits at
          start rather than on submission.
        </p>
      </div>
    </section>
  )
}

function CreditPacksSection({ packs }: { packs: PackConfig[] }) {
  return (
    <section className="border-b border-sage-line/70 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-ink">
            Credit packs — no subscription required
          </h2>
        </div>
        <PricingPacks packs={packs} />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-muted">
          Top up any plan, including Free. Purchased credits roll over for 24
          months. Subscribers save 15%.
        </p>
      </div>
    </section>
  )
}

// --- Full feature comparison table ---

type Cell = string | boolean | "unlimited"

function CellView({ value }: { value: Cell }) {
  if (value === "unlimited") {
    return <span className="font-semibold text-pine">Unlimited</span>
  }
  if (value === true) {
    return (
      <span className="inline-flex text-pine" aria-label="Included">
        <Check className="size-4" aria-hidden />
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="text-ink-muted" aria-label="Not included">
        —
      </span>
    )
  }
  return <span className={cn("text-ink", numericText)}>{value}</span>
}

function ComparisonTable({ plans }: { plans: PlanConfig[] }) {
  const [free, starter, growth, custom] = plans

  const groups: { title: string; rows: { label: string; cells: Cell[] }[] }[] = [
    {
      title: "Volume",
      rows: [
        {
          label: "Candidate credits / month",
          cells: [
            String(free.monthlyCredits),
            String(starter.monthlyCredits),
            String(growth.monthlyCredits),
            "Custom",
          ],
        },
        {
          label: "AI-generated questions / month",
          cells: [
            String(free.aiGenerationsPerMonth),
            String(starter.aiGenerationsPerMonth),
            String(growth.aiGenerationsPerMonth),
            "Custom",
          ],
        },
        {
          label: "Active tests",
          cells: [
            String(free.activeTestLimit),
            "unlimited",
            "unlimited",
            "unlimited",
          ],
        },
        {
          label: "Team seats included",
          cells: [
            String(free.seatsIncluded),
            String(starter.seatsIncluded),
            String(growth.seatsIncluded),
            "unlimited",
          ],
        },
        {
          label: "Extra seats",
          cells: [
            false,
            starter.extraSeatMonthlyCents != null
              ? `${formatUsd(starter.extraSeatMonthlyCents)}/mo`
              : "—",
            growth.extraSeatMonthlyCents != null
              ? `${formatUsd(growth.extraSeatMonthlyCents)}/mo`
              : "—",
            "Included",
          ],
        },
      ],
    },
    {
      title: "Assessments",
      rows: [
        {
          label: "Standard question types (MCQ, short answer)",
          cells: [true, true, true, true],
        },
        {
          label: "Coding IDE with sandboxed execution",
          cells: [true, true, true, true],
        },
        { label: "AI question generation", cells: [true, true, true, true] },
      ],
    },
    {
      title: "Integrity",
      rows: [
        { label: "Tab-switch detection", cells: [true, true, true, true] },
        {
          label: "Proctoring + face verification (2 credits)",
          cells: [
            free.hasProctoring,
            starter.hasProctoring,
            growth.hasProctoring,
            custom.hasProctoring,
          ],
        },
      ],
    },
    {
      title: "Platform",
      rows: [
        {
          label: "Candidate certificates",
          cells: [
            free.hasCertificates,
            starter.hasCertificates,
            growth.hasCertificates,
            custom.hasCertificates,
          ],
        },
        {
          label: "ATS integrations",
          cells: [free.hasAts, starter.hasAts, growth.hasAts, custom.hasAts],
        },
        {
          label: "Results dashboard + CSV export",
          cells: [true, true, true, true],
        },
      ],
    },
    {
      title: "Enterprise",
      rows: [
        { label: "SSO", cells: [false, false, false, true] },
        { label: "Audit logs", cells: [false, false, false, true] },
        { label: "DPA", cells: [false, false, false, true] },
        { label: "Custom data retention", cells: [false, false, false, true] },
        { label: "Dedicated support", cells: [false, false, false, true] },
      ],
    },
  ]

  return (
    <section className="border-b border-sage-line/70 bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center font-sans text-3xl font-semibold tracking-tight text-ink">
          Compare every plan
        </h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sage-line">
                <th className="py-3 pr-4 text-left font-semibold text-ink" />
                {plans.map((plan) => (
                  <th
                    key={plan.name}
                    className="px-4 py-3 text-center font-semibold capitalize text-ink"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.title}>
                  <tr className="bg-paper/60">
                    <td
                      colSpan={5}
                      className="px-1 py-2 text-xs font-semibold uppercase tracking-widest text-pine"
                    >
                      {group.title}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-sage-line/60"
                    >
                      <td className="py-3 pr-4 text-left text-ink">
                        {row.label}
                      </td>
                      {row.cells.map((cell, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          <CellView value={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  {
    q: "What's a candidate credit?",
    a: "One completed assessment. Creating tests and inviting candidates are always free — you only spend a credit when a candidate submits (or, for proctored assessments, when they start).",
  },
  {
    q: "Why do proctored assessments use 2 credits?",
    a: "Recording, storage, and identity verification have real per-candidate costs. Metering them means proctoring is included on every paid plan rather than locked behind an expensive top tier.",
  },
  {
    q: "Is proctoring available on the Free plan?",
    a: "No. Free covers every question type — including the coding IDE — plus tab-switch integrity detection. Camera proctoring and face verification start on the Starter plan.",
  },
  {
    q: "How does regional pricing work?",
    a: "Prices adjust automatically to your country's purchasing power. Every plan includes the same features and the same credit allowance everywhere — only the price changes. Billing is in USD.",
  },
  {
    q: "Can I upgrade, downgrade, or cancel anytime?",
    a: "Yes. Monthly plans change immediately; yearly plans change at the end of the period. Unused pack credits always keep their full 24-month life.",
  },
  {
    q: "Is the Free plan really free forever?",
    a: "Yes — 10 candidate credits every month, no trial clock, and no credit card required.",
  },
  {
    q: "Do credits roll over?",
    a: "Monthly plan credits don't roll over. Purchased pack credits last 24 months from the date of purchase.",
  },
]

function PricingFaq() {
  return (
    <section className="border-b border-sage-line/70 bg-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            FAQ
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Questions, answered
          </h2>
        </div>
        <Accordion multiple={false} className="gap-1">
          {FAQS.map((item) => (
            <AccordionItem
              key={item.q}
              value={item.q}
              className="border-b border-sage-line"
            >
              <AccordionTrigger className="py-4 text-base text-ink">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pr-6 text-sm leading-relaxed text-ink-muted">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="bg-pine">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="font-sans text-3xl font-semibold tracking-tight text-pine-foreground sm:text-4xl">
          Test your first 10 candidates free
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-pine-foreground/80">
          No credit card, no trial clock. Real assessments, including coding —
          free every month.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-lime px-6 py-3 text-sm font-semibold text-lime-ink transition-colors hover:bg-lime/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
          >
            Sign up free
          </Link>
          <Link
            href="/assessments"
            className="inline-flex items-center justify-center rounded-full border border-pine-foreground/30 px-6 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
          >
            Browse the test library
          </Link>
        </div>
      </div>
    </section>
  )
}
