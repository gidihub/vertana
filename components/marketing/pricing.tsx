"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Users } from "lucide-react"

type BillingCycle = "monthly" | "annual"

type Tier = {
  name: string
  monthly: string
  annual: string
  // Per-month price when billed annually, shown as the sub-note.
  annualNote?: string
  cadence: string
  description: string
  features: string[]
  cta: string
  featured: boolean
}

const TIERS: Tier[] = [
  {
    name: "Free",
    monthly: "$0",
    annual: "$0",
    cadence: "/mo",
    description: "For a first role and a small candidate pool.",
    features: [
      "10 candidate credits / month",
      "2 active tests",
      "5 AI-generated questions / month",
      "Timer, deadlines & randomizer",
      "Tab-switch detection",
      "Results dashboard & CSV export",
    ],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Starter",
    monthly: "$19",
    annual: "$15",
    annualNote: "$180 billed annually",
    cadence: "/mo",
    description: "For steady hiring across a role or two.",
    features: [
      "100 candidate credits / month",
      "Unlimited active tests",
      "30 AI-generated questions / month",
      "Everything in Free",
      "Shareable candidate certificates",
    ],
    cta: "Start Starter",
    featured: false,
  },
  {
    name: "Growth",
    monthly: "$39",
    annual: "$31",
    annualNote: "$372 billed annually",
    cadence: "/mo",
    description: "For teams hiring across multiple roles.",
    features: [
      "400 candidate credits / month",
      "100 AI-generated questions / month",
      "Everything in Starter",
      "Proctoring (camera + face verification)",
      "ATS integrations",
    ],
    cta: "Start Growth",
    featured: true,
  },
  {
    name: "Custom",
    monthly: "Let's talk",
    annual: "Let's talk",
    cadence: "",
    description: "For high-volume or regulated hiring.",
    features: [
      "Custom credit volume",
      "SSO & role-based access",
      "Audit logs & DPA",
      "Custom data-retention windows",
      "Dedicated support",
    ],
    cta: "Contact sales",
    featured: false,
  },
]

export function Pricing() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const isAnnual = cycle === "annual"

  return (
    <section id="pricing" className="border-b border-sage-line/70 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Flat pricing with unlimited seats
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            Every plan includes unlimited team members — you only pay for the
            candidates you evaluate.
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            Extra credits beyond your monthly pool: $0.30 each (Starter), $0.25
            each (Growth).
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="mt-8 flex items-center justify-center">
          <div
            role="radiogroup"
            aria-label="Billing cycle"
            className="inline-flex items-center rounded-full border border-sage-line bg-card p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!isAnnual}
              onClick={() => setCycle("monthly")}
              className={
                !isAnnual
                  ? "rounded-full bg-pine px-4 py-2 text-sm font-semibold text-pine-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  : "rounded-full px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              }
            >
              Monthly
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isAnnual}
              onClick={() => setCycle("annual")}
              className={
                isAnnual
                  ? "flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-pine-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  : "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              }
            >
              Annual
              <span
                className={
                  isAnnual
                    ? "rounded-full bg-lime px-2 py-0.5 text-xs font-semibold text-lime-ink"
                    : "rounded-full bg-lime/60 px-2 py-0.5 text-xs font-semibold text-lime-ink"
                }
              >
                2 months free
              </span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const price = isAnnual ? tier.annual : tier.monthly
            const showCadence = tier.cadence !== ""
            return (
              <div
                key={tier.name}
                className={
                  tier.featured
                    ? "relative flex flex-col rounded-2xl border-2 border-pine bg-card p-7 shadow-[0_24px_60px_-34px_rgba(14,74,52,0.55)]"
                    : "relative flex flex-col rounded-2xl border border-sage-line bg-card p-7"
                }
              >
                {tier.featured ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-lime px-3 py-1 text-xs font-semibold text-lime-ink">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold text-ink">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold text-ink">
                    {price}
                  </span>
                  {showCadence ? (
                    <span className="text-sm text-ink-muted">{tier.cadence}</span>
                  ) : null}
                </div>
                {/* Reserve a consistent line for the annual billing note */}
                <p className="mt-1 h-4 text-xs text-ink-muted">
                  {isAnnual && tier.annualNote ? tier.annualNote : ""}
                </p>
                <p className="mt-2 text-sm text-ink-muted">{tier.description}</p>

                <div className="mt-5 flex items-center gap-2 rounded-lg bg-pine/10 px-3 py-2.5 text-sm font-semibold text-pine">
                  <Users className="size-4 shrink-0" aria-hidden />
                  Unlimited team members
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                        <Check className="size-3" aria-hidden />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dashboard"
                  className={
                    tier.featured
                      ? "mt-8 inline-flex items-center justify-center rounded-full bg-pine px-5 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      : "mt-8 inline-flex items-center justify-center rounded-full border border-sage-line px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
