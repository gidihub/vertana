"use client"

import { useEffect, useState } from "react"

import { RecruiterShell } from "@/components/recruiter-shell"
import { OrgUsagePanel } from "@/components/dashboard/org-usage-panel"
import { useOrganization } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import Link from "next/link"
import { linkClass } from "@/lib/design-tokens"

export default function SettingsPage() {
  const org = useOrganization()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  return (
    <RecruiterShell title="Account settings" subtitle="Plan, usage, and account details.">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Signed-in recruiter profile.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{email ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Organization</p>
              <p className="font-medium">{org?.name ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <OrgUsagePanel />

        <p className="text-sm text-muted-foreground">
          Need more credits or coding questions?{" "}
          <Link href="/#pricing" className={linkClass}>
            View pricing
          </Link>{" "}
          or{" "}
          <a href="mailto:support@vertana.app" className={linkClass}>
            contact support
          </a>
          .
        </p>
      </div>
    </RecruiterShell>
  )
}
