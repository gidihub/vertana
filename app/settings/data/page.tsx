import { Suspense } from "react"

import { DataSettings } from "@/components/settings/data-settings"

export default function DataSettingsPage() {
  return (
    <Suspense fallback={null}>
      <DataSettings />
    </Suspense>
  )
}
