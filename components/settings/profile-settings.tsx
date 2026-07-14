"use client"

import { useEffect, useState } from "react"
import { Compass, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { RecruiterShell } from "@/components/recruiter-shell"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { SettingRow, SettingList } from "@/components/settings/setting-row"
import { ProductTour, tourAlreadyDone } from "@/components/product-tour"
import { BillingCheckoutToast } from "@/components/billing/billing-checkout-toast"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useOrganization } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { useAccount } from "@/lib/settings/use-account"

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  custom: "Custom",
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
}

export function ProfileSettings() {
  const org = useOrganization()
  const { account } = useAccount()

  const [displayName, setDisplayName] = useState("")
  const [initialName, setInitialName] = useState("")
  const [savingName, setSavingName] = useState(false)

  const [tourOpen, setTourOpen] = useState(false)
  const [tourDone, setTourDone] = useState(true)

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        const name =
          (data.user?.user_metadata?.display_name as string | undefined) ?? ""
        setDisplayName(name)
        setInitialName(name)
      })
  }, [])

  useEffect(() => {
    setTourDone(tourAlreadyDone())
  }, [])

  async function saveName() {
    setSavingName(true)
    try {
      const { error } = await createClient().auth.updateUser({
        data: { display_name: displayName.trim() },
      })
      if (error) throw error
      setInitialName(displayName.trim())
      toast.success("Profile updated")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingName(false)
    }
  }

  const email = account?.email ?? null
  const role = account?.role ?? null
  const nameDirty = displayName.trim() !== initialName.trim()

  return (
    <RecruiterShell title="Settings" subtitle="Profile">
      <BillingCheckoutToast />
      <SettingsLayout>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>
                Your personal information within this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingList>
                <SettingRow
                  htmlFor="display-name"
                  title="Display name"
                  description="Shown to teammates on shared tests and comments."
                  control={
                    <div className="flex items-center gap-2">
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="w-48"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!nameDirty || savingName}
                        onClick={() => void saveName()}
                      >
                        {savingName ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  }
                />
                <SettingRow
                  title="Email"
                  description="Used to sign in. Contact support to change it."
                  control={
                    <span className="text-sm text-ink-muted">{email ?? "—"}</span>
                  }
                />
                <SettingRow
                  title="Role"
                  description="Your permission level in this organization."
                  control={
                    <Badge variant="secondary" className="capitalize">
                      {role ? ROLE_LABELS[role] ?? role : "—"}
                    </Badge>
                  }
                />
              </SettingList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
              <CardDescription>
                The workspace you&rsquo;re signed in to.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingList>
                <SettingRow
                  title="Name"
                  control={
                    <span className="text-sm font-medium text-ink">
                      {org?.name ?? "—"}
                    </span>
                  }
                />
                <SettingRow
                  title="Plan"
                  description="Manage your plan under Billing."
                  control={
                    <Badge variant="secondary">
                      {org ? TIER_LABELS[org.plan_tier] ?? org.plan_tier : "—"}
                    </Badge>
                  }
                />
              </SettingList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product tour</CardTitle>
              <CardDescription>
                Take a quick guided walkthrough of the workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTourOpen(true)}
              >
                <Compass data-icon="inline-start" />
                {tourDone ? "Replay product tour" : "Start product tour"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
      {tourOpen && (
        <ProductTour
          onDone={() => {
            setTourOpen(false)
            setTourDone(tourAlreadyDone())
          }}
        />
      )}
    </RecruiterShell>
  )
}
