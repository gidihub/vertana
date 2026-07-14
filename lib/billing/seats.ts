import { ANCHOR_TIER, type PppTier } from "@/lib/billing/ppp"
import {
  extraSeatCentsForPlan,
  seatsIncludedForPlan,
} from "@/lib/pricing/config"
import type { PlanName } from "@/lib/pricing/config"
import type { PlanTier } from "@/lib/plans"
import { createAdminClient } from "@/lib/supabase/admin"

export interface SeatUsage {
  /** Active team members. */
  members: number
  /** Pending (unaccepted) invites — each reserves a prospective seat. */
  pendingInvites: number
  /** members + pendingInvites. */
  used: number
  /** Seats included with the plan. null = unlimited (Custom). */
  included: number | null
  /** Paid extra seats from the subscription. */
  extraSeats: number
  /** included + extraSeats. null = unlimited. */
  total: number | null
  /** Whether another teammate can be invited. */
  canInvite: boolean
  /** Monthly price (cents) of one extra seat at this org's tier; null if N/A. */
  extraSeatPriceCents: number | null
}

/** Included + extra seats for an org's plan. null = unlimited. */
export function seatAllowance(
  planTier: PlanTier,
  extraSeats: number,
): number | null {
  const included = seatsIncludedForPlan(planTier as PlanName)
  if (included == null) return null
  return included + Math.max(0, extraSeats)
}

/**
 * Current seat usage for an org. `used` counts active members plus pending
 * invites, so a pending invite already reserves a seat.
 */
export async function getSeatUsage(orgId: string): Promise<SeatUsage> {
  const admin = createAdminClient()

  const [memberRes, inviteRes, orgRes] = await Promise.all([
    admin
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("team_invites")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending"),
    admin
      .from("organizations")
      .select("plan_tier, ppp_tier, extra_seats")
      .eq("id", orgId)
      .single(),
  ])

  const members = memberRes.count ?? 0
  const pendingInvites = inviteRes.count ?? 0
  const planTier = (orgRes.data?.plan_tier as PlanTier | undefined) ?? "free"
  const pppTier = (orgRes.data?.ppp_tier as PppTier | null) ?? ANCHOR_TIER
  const extraSeats = (orgRes.data?.extra_seats as number | undefined) ?? 0

  const included = seatsIncludedForPlan(planTier as PlanName)
  const total = seatAllowance(planTier, extraSeats)
  const used = members + pendingInvites

  return {
    members,
    pendingInvites,
    used,
    included,
    extraSeats,
    total,
    canInvite: total == null || used < total,
    extraSeatPriceCents:
      planTier === "free" || planTier === "custom"
        ? null
        : extraSeatCentsForPlan(planTier as PlanName, pppTier),
  }
}
