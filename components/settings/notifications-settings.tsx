"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { RecruiterShell } from "@/components/recruiter-shell"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { SettingRow, SettingList } from "@/components/settings/setting-row"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { refreshStore, useOrganization } from "@/lib/store"
import { useAccount } from "@/lib/settings/use-account"
import {
  DEFAULT_NOTIFICATION_PREFS,
  readNotificationPrefs,
  writeNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/settings/notification-prefs"

type Row = {
  key: keyof NotificationPrefs
  title: string
  description: string
}

const ACTIVITY_ROWS: Row[] = [
  {
    key: "candidateCompleted",
    title: "Candidate completions",
    description: "Email me when a candidate finishes one of my tests.",
  },
  {
    key: "teamActivity",
    title: "Team activity",
    description: "Email me when teammates are invited or join the workspace.",
  },
  {
    key: "weeklyDigest",
    title: "Weekly digest",
    description: "A summary of assessment activity every Monday.",
  },
]

const GENERAL_ROWS: Row[] = [
  {
    key: "emailUpdates",
    title: "Account emails",
    description: "Receipts, security alerts, and important account updates.",
  },
  {
    key: "productNews",
    title: "Product news",
    description: "Occasional tips and announcements about new features.",
  },
]

function DefaultReplyToCard() {
  const org = useOrganization()
  const { account } = useAccount()
  const canManage = account?.role === "owner" || account?.role === "admin"

  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(org?.default_reply_to ?? "")
  }, [org?.default_reply_to])

  const dirty = value.trim() !== (org?.default_reply_to ?? "")

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/org/reply-to", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyTo: value.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save reply-to")
      await refreshStore()
      toast.success(
        value.trim()
          ? "Default reply-to saved"
          : "Default reply-to cleared",
      )
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Candidate invitations</CardTitle>
        <CardDescription>
          Set a default Reply-To for invitation emails so candidate replies reach
          the right inbox. It pre-fills the invite dialog and can be overridden
          per send.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingList>
          <SettingRow
            title="Default reply-to address"
            description="Applied to new candidate invites when no address is entered."
            control={
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="recruiting@company.com"
                  className="w-56"
                  value={value}
                  disabled={!canManage || saving}
                  onChange={(e) => setValue(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!canManage || saving || !dirty}
                  onClick={() => void save()}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            }
          />
        </SettingList>
        {!canManage ? (
          <p className="pt-2 text-xs text-ink-muted">
            Only owners and admins can change the default reply-to.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function NotificationsSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS,
  )

  useEffect(() => {
    setPrefs(readNotificationPrefs())
  }, [])

  function toggle(key: keyof NotificationPrefs, value: boolean) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value }
      writeNotificationPrefs(next)
      return next
    })
  }

  function renderRows(rows: Row[]) {
    return (
      <SettingList>
        {rows.map((row) => (
          <SettingRow
            key={row.key}
            title={row.title}
            description={row.description}
            control={
              <Switch
                checked={prefs[row.key]}
                onCheckedChange={(v) => toggle(row.key, v)}
                aria-label={row.title}
              />
            }
          />
        ))}
      </SettingList>
    )
  }

  return (
    <RecruiterShell title="Settings" subtitle="Notifications">
      <SettingsLayout>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
              <CardDescription>
                Control which assessment events email you.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderRows(ACTIVITY_ROWS)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">General</CardTitle>
              <CardDescription>Account and product communications.</CardDescription>
            </CardHeader>
            <CardContent>{renderRows(GENERAL_ROWS)}</CardContent>
          </Card>

          <DefaultReplyToCard />

          <p className="text-xs text-ink-muted">
            Preferences are saved to this browser. Organization-wide email
            delivery is configured per test.
          </p>
        </div>
      </SettingsLayout>
    </RecruiterShell>
  )
}
