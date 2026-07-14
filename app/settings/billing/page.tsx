import { Suspense } from "react"

import { BillingSettings } from "@/components/settings/billing-settings"

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={null}>
      <BillingSettings />
    </Suspense>
  )
}
