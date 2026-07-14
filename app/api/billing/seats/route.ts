import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { auditRecruiterAction } from "@/lib/audit/events"
import { getSeatUsage } from "@/lib/billing/seats"
import { setExtraSeats, SeatChangeError } from "@/lib/billing/manage-seats"
import { isStripeConfigured } from "@/lib/stripe/env"
import { getOrganization } from "@/lib/org"

const bodySchema = z.object({
  extraSeats: z.number().int().min(0).max(100),
})

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, user, role }) => {
    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only organization owners can manage seats" },
        { status: 403 },
      )
    }
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe billing is not configured" },
        { status: 503 },
      )
    }

    try {
      const body = bodySchema.parse(await req.json())
      const org = await getOrganization()
      const quantity = await setExtraSeats(org, body.extraSeats)

      try {
        await auditRecruiterAction({
          orgId,
          userId: user.id,
          action: "billing.seats_updated",
          resourceType: "organization",
          resourceId: orgId,
          metadata: { extra_seats: quantity },
        })
      } catch {
        // Audit failure shouldn't block the seat change.
      }

      const seats = await getSeatUsage(orgId)
      return NextResponse.json({ seats })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
      }
      if (err instanceof SeatChangeError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      console.error("[seats] failed to update:", err)
      return NextResponse.json(
        { error: "Failed to update seats" },
        { status: 500 },
      )
    }
  })
}
