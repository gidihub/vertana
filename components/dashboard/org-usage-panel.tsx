"use client"

import Link from "next/link"
import { Code2, Sparkles, Coins } from "lucide-react"

import { useOrganization } from "@/lib/store"
import { formatDate } from "@/lib/format"
import { codingStatusForOrg } from "@/lib/coding/limits"
import { aiLimitForTier, type PlanTier } from "@/lib/plans"
import { linkClass, numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const TIER_LABELS: Record<PlanTier, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  custom: "Custom",
}

export function OrgUsagePanel() {
  const org = useOrganization()
  if (!org) return null

  const tier = org.plan_tier as PlanTier
  const aiLimit = aiLimitForTier(tier)
  const codingStatus = codingStatusForOrg(tier, org.ppp_tier ?? null)

  return (
    <Card className="border-sage-line/70 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Plan & usage</CardTitle>
        <CardDescription>
          Internal counters for {org.name} — not visible to candidates.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UsageItem
          icon={Sparkles}
          label="Plan tier"
          value={TIER_LABELS[tier]}
          detail={codingStatus.detail}
        />
        <UsageItem
          icon={Sparkles}
          label="AI generations"
          value={`${org.ai_generations_used}/${aiLimit}`}
          detail={`Resets ${formatDate(org.ai_generations_reset_at)}`}
          mono
        />
        <UsageItem
          icon={Coins}
          label="Candidate credits"
          value={String(org.credits_remaining)}
          detail={`Resets ${formatDate(org.credits_reset_at)}`}
          mono
        />
        <UsageItem
          icon={Code2}
          label="Code executions"
          value={String(org.code_executions_used)}
          detail={`Resets ${formatDate(org.code_executions_reset_at)} · scratch + graded`}
          mono
        />
      </CardContent>
      {codingStatus.showUpgrade && (
        <div className="border-t border-border px-6 py-3 text-sm text-muted-foreground">
          Need coding questions?{" "}
          <Link href="/#pricing" className={linkClass}>
            Upgrade to Growth
          </Link>
          .
        </div>
      )}
    </Card>
  )
}

function UsageItem({
  icon: Icon,
  label,
  value,
  detail,
  mono = false,
}: {
  icon: typeof Sparkles
  label: string
  value: string
  detail?: string
  mono?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p
        className={cn(
          "text-xl font-semibold text-foreground",
          mono && numericText,
        )}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  )
}
