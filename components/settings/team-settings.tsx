"use client"

import Link from "next/link"

import { RecruiterShell } from "@/components/recruiter-shell"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { TeamPanel } from "@/components/team/team-panel"
import { linkClass } from "@/lib/design-tokens"

export function TeamSettings() {
  return (
    <RecruiterShell title="Settings" subtitle="Team">
      <SettingsLayout>
        <div className="flex flex-col gap-4">
          <TeamPanel />
          <p className="text-center text-xs text-ink-muted">
            Need more seats? Add them under{" "}
            <Link href="/settings/billing" className={linkClass}>
              Billing
            </Link>
            .
          </p>
        </div>
      </SettingsLayout>
    </RecruiterShell>
  )
}
