import { Suspense } from "react"

import { ProfileSettings } from "@/components/settings/profile-settings"

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <ProfileSettings />
    </Suspense>
  )
}
