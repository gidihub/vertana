import { Suspense } from "react"

import { NotificationsSettings } from "@/components/settings/notifications-settings"

export default function NotificationsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsSettings />
    </Suspense>
  )
}
