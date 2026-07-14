"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Plug } from "lucide-react"
import { toast } from "sonner"

import { RecruiterShell } from "@/components/recruiter-shell"
import { SettingsLayout } from "@/components/settings/settings-layout"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  INTEGRATIONS,
  INTEGRATION_CATEGORIES,
  type IntegrationCategory,
  type IntegrationProvider,
  type IntegrationStatus,
} from "@/lib/integrations/catalog"

/** Renders the provider's brand logo, falling back to a generic plug icon. */
function IntegrationLogo({ provider }: { provider: IntegrationProvider }) {
  const [failed, setFailed] = useState(false)
  if (provider.domain && !failed) {
    return (
      <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-sage-line/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${provider.domain}&sz=64`}
          alt={`${provider.name} logo`}
          width={20}
          height={20}
          className="size-5 object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }
  return (
    <div className="flex size-9 items-center justify-center rounded-lg bg-pine/10 text-pine">
      <Plug className="size-4" />
    </div>
  )
}

export function IntegrationsSettings() {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({})
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<IntegrationProvider | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch("/api/integrations")
      if (!res.ok) return
      const data = await res.json()
      const map: Record<string, IntegrationStatus> = {}
      for (const s of (data.integrations as IntegrationStatus[]) ?? []) {
        map[s.provider] = s
      }
      setStatuses(map)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const grouped = useMemo(() => {
    const groups: Record<IntegrationCategory, IntegrationProvider[]> = {
      ats: [],
      automation: [],
    }
    for (const p of INTEGRATIONS) groups[p.category].push(p)
    return groups
  }, [])

  function openConnect(provider: IntegrationProvider) {
    setActive(provider)
    setForm(Object.fromEntries(provider.fields.map((f) => [f.key, ""])))
  }

  async function connect() {
    if (!active) return
    setSaving(true)
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: active.id, config: form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to connect")
      toast.success(`${active.name} connected`)
      setActive(null)
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function disconnect(provider: IntegrationProvider) {
    setDisconnecting(provider.id)
    try {
      const res = await fetch(`/api/integrations?provider=${provider.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to disconnect")
      toast.success(`${provider.name} disconnected`)
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDisconnecting(null)
    }
  }

  function renderGroup(category: IntegrationCategory) {
    const providers = grouped[category]
    if (providers.length === 0) return null
    return (
      <Card key={category}>
        <CardHeader>
          <CardTitle className="text-base">
            {INTEGRATION_CATEGORIES[category]}
          </CardTitle>
          <CardDescription>
            {category === "ats"
              ? "Connect Vertana to your applicant tracking system."
              : "Automate workflows when candidates complete tests."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => {
            const connected = statuses[provider.id]?.status === "connected"
            return (
              <div
                key={provider.id}
                className="flex flex-col gap-3 rounded-lg border border-sage-line/70 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <IntegrationLogo provider={provider} />
                  {connected ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="size-3" />
                      Connected
                    </Badge>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{provider.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {provider.description}
                  </p>
                </div>
                <div className="mt-auto">
                  {connected ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={disconnecting === provider.id}
                      onClick={() => void disconnect(provider)}
                    >
                      {disconnecting === provider.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openConnect(provider)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <RecruiterShell title="Settings" subtitle="Integrations">
      <SettingsLayout>
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-ink-muted" />
            </div>
          ) : (
            <>
              {renderGroup("ats")}
              {renderGroup("automation")}
            </>
          )}
        </div>
      </SettingsLayout>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null)
        }}
      >
        <DialogContent>
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>Connect {active.name}</DialogTitle>
                <DialogDescription>
                  {active.description}
                  {active.docsUrl ? (
                    <>
                      {" "}
                      <a href={active.docsUrl} target="_blank" rel="noreferrer">
                        View docs
                      </a>
                    </>
                  ) : null}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                {active.fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`field-${field.key}`}
                      type={field.type === "password" ? "password" : "text"}
                      placeholder={field.placeholder}
                      value={form[field.key] ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  className="mt-1 w-full"
                  disabled={saving}
                  onClick={() => void connect()}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </Button>
                <p className="text-center text-[11px] text-ink-muted">
                  Credentials are stored securely and never shown again.
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </RecruiterShell>
  )
}
