"use client"

import { useState } from "react"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useOrganization } from "@/lib/store"
import { formatDate } from "@/lib/format"
import { isPaidPlanTier, type PlanTier } from "@/lib/plans"
import type { BillingCycle } from "@/lib/stripe/prices"
import { cn } from "@/lib/utils"

const TIER_LABELS: Record<PlanTier, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  custom: "Custom",
}

async function startCheckout(tier: "starter" | "growth", cycle: BillingCycle) {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, cycle }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Checkout failed")
  }
  window.location.href = data.url
}

async function openPortal() {
  const res = await fetch("/api/billing/portal", { method: "POST" })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Billing portal failed")
  }
  window.location.href = data.url
}

export function BillingActions() {
  const org = useOrganization()
  const [loading, setLoading] = useState<string | null>(null)
  const [cycle, setCycle] = useState<BillingCycle>("monthly")

  if (!org) return null

  const tier = org.plan_tier as PlanTier
  const hasSubscription = Boolean(org.stripe_subscription_id)
  const isPaid = isPaidPlanTier(tier)

  async function handleCheckout(
    target: "starter" | "growth",
    cycle: BillingCycle,
  ) {
    setLoading(`${target}-${cycle}`)
    try {
      await startCheckout(target, cycle)
    } catch (err) {
      toast.error((err as Error).message)
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading("portal")
    try {
      await openPortal()
    } catch (err) {
      toast.error((err as Error).message)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Current plan</p>
        <p className="mt-1 text-lg font-semibold">{TIER_LABELS[tier]}</p>
        {org.subscription_status ? (
          <p className="mt-1 text-xs text-muted-foreground capitalize">
            Subscription {org.subscription_status.replace(/_/g, " ")}
            {org.current_period_end
              ? ` · renews ${formatDate(org.current_period_end)}`
              : null}
          </p>
        ) : null}
      </div>

      {hasSubscription ? (
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={loading !== null}
          onClick={() => void handlePortal()}
        >
          {loading === "portal" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CreditCard className="size-4" />
          )}
          Manage subscription
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <div
            role="radiogroup"
            aria-label="Billing cycle"
            className="inline-flex w-fit items-center rounded-full border border-border bg-muted/30 p-1"
          >
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={cycle === option}
                onClick={() => setCycle(option)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  cycle === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!isPaid || tier === "starter" ? (
            <Button
              type="button"
              disabled={loading !== null}
              onClick={() => void handleCheckout("starter", cycle)}
            >
              {loading === `starter-${cycle}` ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Upgrade to Starter
              {cycle === "annual" ? " (annual)" : ""}
            </Button>
          ) : null}
          {tier !== "growth" && tier !== "custom" ? (
            <Button
              type="button"
              variant={tier === "free" ? "default" : "outline"}
              disabled={loading !== null}
              onClick={() => void handleCheckout("growth", cycle)}
            >
              {loading === `growth-${cycle}` ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Upgrade to Growth
              {cycle === "annual" ? " (annual)" : ""}
            </Button>
          ) : null}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Billing is managed by Stripe. Only organization owners can upgrade or
        change plans.
      </p>
    </div>
  )
}
