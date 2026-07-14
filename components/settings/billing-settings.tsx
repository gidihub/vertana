"use client"

import { useEffect, useState } from "react"
import { ExternalLink, FileDown, Loader2 } from "lucide-react"

import { RecruiterShell } from "@/components/recruiter-shell"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { BillingActions } from "@/components/billing/billing-actions"
import { BillingCheckoutToast } from "@/components/billing/billing-checkout-toast"
import { OrgUsagePanel } from "@/components/dashboard/org-usage-panel"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { InvoiceView } from "@/lib/billing/invoice"

function formatAmount(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

function InvoiceHistory() {
  const [invoices, setInvoices] = useState<InvoiceView[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/billing/invoices")
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true)
          return null
        }
        return res.ok ? res.json() : null
      })
      .then((data) => {
        if (cancelled || !data) return
        setInvoices((data.invoices as InvoiceView[]) ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (forbidden) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invoice history</CardTitle>
        <CardDescription>Recent invoices from Stripe.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-ink-muted" />
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <p className="py-2 text-sm text-ink-muted">
            No invoices yet. Invoices appear here once you have a paid
            subscription.
          </p>
        ) : (
          <ul className="divide-y divide-sage-line/60">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {new Date(inv.created * 1000).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {inv.number ? (
                      <span className="ml-2 font-mono text-xs text-ink-muted">
                        {inv.number}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatAmount(inv.amountPaid, inv.currency)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {inv.status ? (
                    <Badge
                      variant={inv.status === "paid" ? "secondary" : "outline"}
                      className="capitalize"
                    >
                      {inv.status}
                    </Badge>
                  ) : null}
                  {inv.hostedUrl ? (
                    <a
                      href={inv.hostedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted hover:text-pine"
                      aria-label="View invoice"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  ) : null}
                  {inv.pdfUrl ? (
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted hover:text-pine"
                      aria-label="Download invoice PDF"
                    >
                      <FileDown className="size-4" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function BillingSettings() {
  return (
    <RecruiterShell title="Settings" subtitle="Billing">
      <BillingCheckoutToast />
      <SettingsLayout>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan & subscription</CardTitle>
              <CardDescription>
                Upgrade your plan, manage seats, or open the billing portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingActions />
            </CardContent>
          </Card>

          <OrgUsagePanel />

          <InvoiceHistory />
        </div>
      </SettingsLayout>
    </RecruiterShell>
  )
}
