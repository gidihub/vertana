"use client"

import { useEffect, useState } from "react"
import { Download, Loader2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { refreshStore, useOrganization } from "@/lib/store"
import { useAccount } from "@/lib/settings/use-account"
import { PROCTORING_RETENTION_DAYS } from "@/lib/proctoring/config"

const CUSTOM = "custom"
const DAYS_PER_MONTH = 30
const DAYS_PER_YEAR = 365
// Mirrors the DB check constraint on organizations.data_retention_days.
const MIN_DAYS = 1
const MAX_DAYS = 3650

const RETENTION_OPTIONS = [
  { value: "default", label: `Default (${PROCTORING_RETENTION_DAYS} days)` },
  { value: "30", label: "1 month" },
  { value: "90", label: "3 months" },
  { value: "180", label: "6 months" },
  { value: "365", label: "1 year" },
  { value: CUSTOM, label: "Custom…" },
]

const PRESET_DAYS = new Set([30, 90, 180, 365])

type Unit = "months" | "years"

function daysFromCustom(value: number, unit: Unit): number {
  const days = Math.round(value * (unit === "years" ? DAYS_PER_YEAR : DAYS_PER_MONTH))
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, days))
}

/** Best-effort reverse mapping of a stored day count to a friendly unit. */
function customFromDays(days: number): { value: number; unit: Unit } {
  if (days % DAYS_PER_YEAR === 0) {
    return { value: days / DAYS_PER_YEAR, unit: "years" }
  }
  return { value: Math.round(days / DAYS_PER_MONTH), unit: "months" }
}

export function DataSettings() {
  const org = useOrganization()
  const { account } = useAccount()
  const canManage = account?.role === "owner" || account?.role === "admin"

  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const storedDays = org?.data_retention_days ?? null
  const isCustom = storedDays != null && !PRESET_DAYS.has(storedDays)

  // The Select value: a preset day count, "default", or "custom".
  const selection =
    storedDays == null ? "default" : isCustom ? CUSTOM : String(storedDays)

  const [mode, setMode] = useState<string>(selection)
  const initialCustom = isCustom
    ? customFromDays(storedDays as number)
    : { value: 6, unit: "months" as Unit }
  const [customValue, setCustomValue] = useState<string>(String(initialCustom.value))
  const [customUnit, setCustomUnit] = useState<Unit>(initialCustom.unit)

  // Sync local state to the stored value whenever it loads or changes (e.g.
  // after org hydration or a successful save).
  useEffect(() => {
    setMode(selection)
    if (isCustom && storedDays != null) {
      const c = customFromDays(storedDays)
      setCustomValue(String(c.value))
      setCustomUnit(c.unit)
    }
  }, [selection, isCustom, storedDays])

  async function saveRetention(days: number | null) {
    setSaving(true)
    try {
      const res = await fetch("/api/org/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update retention")
      await refreshStore()
      toast.success("Data retention updated")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function onSelectChange(value: string) {
    setMode(value)
    if (value === CUSTOM) return // wait for the user to apply a custom window
    void saveRetention(value === "default" ? null : Number(value))
  }

  function applyCustom() {
    const parsed = Number(customValue)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter a number greater than zero")
      return
    }
    void saveRetention(daysFromCustom(parsed, customUnit))
  }

  function exportCandidates() {
    setExporting(true)
    try {
      window.location.href = "/api/export/candidates"
    } finally {
      // The browser handles the download; reset shortly after.
      setTimeout(() => setExporting(false), 1500)
    }
  }

  return (
    <RecruiterShell title="Settings" subtitle="Data & privacy">
      <SettingsLayout>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data retention</CardTitle>
              <CardDescription>
                How long proctoring recordings are kept before automatic
                deletion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingList>
                <SettingRow
                  title="Proctoring media retention"
                  description="Applies to newly captured screen and webcam recordings."
                  control={
                    <div className="flex items-center gap-2">
                      {saving ? (
                        <Loader2 className="size-4 animate-spin text-ink-muted" />
                      ) : null}
                      <Select
                        value={mode}
                        onValueChange={(v) => onSelectChange(v ?? "default")}
                        disabled={!canManage || saving}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RETENTION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  }
                />
                {mode === CUSTOM ? (
                  <SettingRow
                    title="Custom window"
                    description="Recordings are deleted this long after capture (max 10 years)."
                    control={
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                          disabled={!canManage || saving}
                          className="w-20"
                        />
                        <Select
                          value={customUnit}
                          onValueChange={(v) => setCustomUnit((v as Unit) ?? "months")}
                          disabled={!canManage || saving}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={applyCustom}
                          disabled={!canManage || saving}
                        >
                          Apply
                        </Button>
                      </div>
                    }
                  />
                ) : null}
              </SettingList>
              {!canManage ? (
                <p className="pt-2 text-xs text-ink-muted">
                  Only owners and admins can change data retention.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export data</CardTitle>
              <CardDescription>
                Download a spreadsheet of every candidate on your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow
                title="Candidate export"
                description="Emails, tests, scores, dispositions, and integrity signals as CSV."
                control={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={exporting}
                    onClick={exportCandidates}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download data-icon="inline-start" />
                    )}
                    Export to CSV
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    </RecruiterShell>
  )
}
