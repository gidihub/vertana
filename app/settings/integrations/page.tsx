import { Suspense } from "react"

import { IntegrationsSettings } from "@/components/settings/integrations-settings"

export default function IntegrationsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsSettings />
    </Suspense>
  )
}
