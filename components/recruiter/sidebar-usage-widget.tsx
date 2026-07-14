"use client"

import Link from "next/link"
import { Code2, Coins, Sparkles } from "lucide-react"

import { useOrganization } from "@/lib/store"
import { aiLimitForTier, type PlanTier } from "@/lib/plans"
import { codingStatusForOrg } from "@/lib/coding/limits"
import { linkClass, numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

const TIER_LABELS: Record<PlanTier, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  custom: "Custom",
}

export function SidebarUsageWidget({ compact = false }: { compact?: boolean }) {
  const org = useOrganization()
  if (!org) return null

  const tier = org.plan_tier as PlanTier
  const aiLimit = aiLimitForTier(tier)
  const codingStatus = codingStatusForOrg(tier, org.ppp_tier ?? null)
  const aiRemaining = Math.max(0, aiLimit - org.ai_generations_used)

  return (
    <div
      data-tour="sidebar-usage"
      className={cn(
        "rounded-lg border border-sage-line/80 bg-paper/60 p-3",
        compact && "text-xs",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Plan & usage
        </span>
        <span className="rounded-full bg-pine/10 px-2 py-0.5 text-[11px] font-medium text-pine">
          {TIER_LABELS[tier]}
        </span>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <Sparkles className="size-3.5" />
            AI left
          </span>
          <span className={cn("font-medium", numericText)}>{aiRemaining}</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <Coins className="size-3.5" />
            Credits
          </span>
          <span className={cn("font-medium", numericText)}>{org.credits_remaining}</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <Code2 className="size-3.5" />
            Executions
          </span>
          <span className={cn("font-medium", numericText)}>{org.code_executions_used}</span>
        </li>
      </ul>
      <div className="mt-2.5 flex flex-col gap-1 border-t border-sage-line/60 pt-2.5">
        {codingStatus.showUpgrade && (
          <Link href="/#pricing" className={cn(linkClass, "text-xs")}>
            Upgrade for coding
          </Link>
        )}
        <Link href="/settings" className={cn(linkClass, "text-xs")}>
          View full details
        </Link>
      </div>
    </div>
  )
}
