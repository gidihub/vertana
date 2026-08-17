import { NextResponse } from "next/server"

import { handleApiAuth } from "@/lib/auth/api"
import { requireBillingPermission } from "@/lib/auth/resource-access"
import { getOrganization } from "@/lib/org"
import { getStripe } from "@/lib/stripe/client"
import { isStripeConfigured } from "@/lib/stripe/env"
import type { InvoiceView } from "@/lib/billing/invoice"

export async function GET() {
  return handleApiAuth(async () => {
    await requireBillingPermission()

    const org = await getOrganization()
    if (!isStripeConfigured() || !org.stripe_customer_id) {
      return NextResponse.json({ invoices: [] })
    }

    try {
      const stripe = getStripe()
      const list = await stripe.invoices.list({
        customer: org.stripe_customer_id,
        limit: 12,
      })

      const invoices: InvoiceView[] = list.data.map((inv) => ({
        id: inv.id,
        number: inv.number ?? null,
        created: inv.created,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status ?? null,
        hostedUrl: inv.hosted_invoice_url ?? null,
        pdfUrl: inv.invoice_pdf ?? null,
      }))

      return NextResponse.json({ invoices })
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 502 },
      )
    }
  })
}
