"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { buyPack } from "@/app/pricing/actions"
import type { PackConfig } from "@/lib/pricing/config"
import { formatUsd, packPerCandidateCost } from "@/lib/pricing"
import { formatLocalEstimate } from "@/lib/pricing/currency"
import { useCurrency } from "@/components/marketing/currency-context"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

export function PricingPacks({ packs }: { packs: PackConfig[] }) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {packs.map((pack) => (
        <PackCard key={pack.id} pack={pack} />
      ))}
    </div>
  )
}

function PackCard({ pack }: { pack: PackConfig }) {
  const [pending, startTransition] = useTransition()
  const { currency } = useCurrency()
  const perCandidate = packPerCandidateCost(pack)
  const local = formatLocalEstimate(pack.priceCents, currency)
  const usdPrice = formatUsd(pack.priceCents)
  const price = local ?? usdPrice
  const usdPeg = local ? usdPrice : null
  const priceSizeClass =
    price.length >= 10 ? "text-xl" : price.length >= 8 ? "text-2xl" : "text-3xl"

  const onClick = () => {
    startTransition(async () => {
      const result = await buyPack(pack.id)
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
    <div className="flex flex-col rounded-2xl border border-sage-line bg-card p-7">
      <div className="flex items-baseline justify-between">
        <h3 className={cn("text-2xl font-semibold text-ink", numericText)}>
          {pack.credits}
        </h3>
        <span className="text-sm text-ink-muted">credits</span>
      </div>
      <div className="mt-4 flex min-w-0 items-baseline gap-1.5">
        <span
          className={cn(
            "font-semibold text-ink whitespace-nowrap",
            priceSizeClass,
            numericText,
          )}
        >
          {price}
        </span>
      </div>
      {usdPeg ? (
        <p className={cn("mt-1 text-xs text-ink-muted", numericText)}>
          = {usdPeg} USD
        </p>
      ) : null}
      <p className="mt-1 text-xs text-ink-muted">
        ${perCandidate.toFixed(2)} per candidate
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-sage-line px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-60"
      >
        {pending ? "Redirecting…" : "Buy credits"}
      </button>
    </div>
  )
}
