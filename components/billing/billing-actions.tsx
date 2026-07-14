"use client"

import { useEffect, useState } from "react"
import { CreditCard, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useOrganization } from "@/lib/store"
import { formatDate } from "@/lib/format"
import { isPaidPlanTier, type PlanTier } from "@/lib/plans"
import type { SeatUsage } from "@/lib/billing/seats"
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

function formatUsdCents(cents: number): string {
  return `$${Math.round(cents / 100)}`
}

function SeatSummary({
  seats,
  canManage,
  onChange,
}: {
  seats: SeatUsage
  canManage: boolean
  onChange: (extraSeats: number) => Promise<void>
}) {
  const [pending, setPending] = useState(false)
  const unlimited = seats.total == null

  async function change(delta: number) {
    const next = Math.max(0, seats.extraSeats + delta)
    if (next === seats.extraSeats) return
    setPending(true)
    try {
      await onChange(next)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="size-4" />
        Team seats
      </div>
      <p className="mt-1 text-lg font-semibold">
        {seats.used}
        {unlimited ? " used" : ` / ${seats.total}`}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {unlimited
          ? "Unlimited seats included"
          : `${seats.included} included${
              seats.extraSeats > 0 ? ` + ${seats.extraSeats} extra` : ""
            }`}
        {seats.extraSeatPriceCents != null
          ? ` · extra seats ${formatUsdCents(seats.extraSeatPriceCents)}/mo each`
          : ""}
      </p>

      {canManage && seats.extraSeatPriceCents != null ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Extra seats</span>
          <div className="inline-flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              disabled={pending || seats.extraSeats <= 0}
              onClick={() => void change(-1)}
              aria-label="Remove an extra seat"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : "−"}
            </Button>
            <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
              {seats.extraSeats}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              disabled={pending}
              onClick={() => void change(1)}
              aria-label="Add an extra seat"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : "+"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function BillingActions() {
  const org = useOrganization()
  const [loading, setLoading] = useState<string | null>(null)
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const [seats, setSeats] = useState<SeatUsage | null>(null)
  const [canManageSeats, setCanManageSeats] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        if (data.seats) setSeats(data.seats as SeatUsage)
        setCanManageSeats(Boolean(data.canManageSeats))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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

  async function handleSeatChange(extraSeats: number) {
    try {
      const res = await fetch("/api/billing/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraSeats }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update seats")
      setSeats(data.seats as SeatUsage)
      toast.success("Seats updated")
    } catch (err) {
      toast.error((err as Error).message)
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

      {seats ? (
        <SeatSummary
          seats={seats}
          canManage={hasSubscription && canManageSeats}
          onChange={handleSeatChange}
        />
      ) : null}

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
