import { Suspense } from "react"

import { TeamSettings } from "@/components/settings/team-settings"

export default function TeamSettingsPage() {
  return (
    <Suspense fallback={null}>
      <TeamSettings />
    </Suspense>
  )
}
