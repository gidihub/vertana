import { Suspense } from "react"

import { SecuritySettings } from "@/components/settings/security-settings"

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={null}>
      <SecuritySettings />
    </Suspense>
  )
}
