"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { RecruiterShell } from "@/components/recruiter-shell"
import { SettingsLayout } from "@/components/settings/settings-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  CONFIGURABLE_ROLES,
  ROLE_IDS,
  type AssessmentViewScope,
  type OrgPermissionState,
  type PermissionDomain,
  type PermissionKey,
  type ReviewerScope,
  type RoleId,
  isLockedRole,
} from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"

type MatrixPayload = {
  roles: Array<{
    id: RoleId
    label: string
    description: string
    locked: boolean
  }>
  domains: PermissionDomain[]
  permissions: OrgPermissionState["permissions"]
  scopes: OrgPermissionState["scopes"]
}

function ScopeRadio<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  name: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 text-xs",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            disabled={disabled}
            onChange={() => onChange(opt.value)}
            className="accent-pine"
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

function isMatrixDirty(a: MatrixPayload, b: MatrixPayload): boolean {
  return (
    JSON.stringify(a.permissions) !== JSON.stringify(b.permissions) ||
    JSON.stringify(a.scopes) !== JSON.stringify(b.scopes)
  )
}

function mergeRoleFromServer(
  state: MatrixPayload,
  roleId: RoleId,
  json: Pick<MatrixPayload, "permissions" | "scopes">,
): MatrixPayload {
  return {
    ...state,
    permissions: {
      ...state.permissions,
      [roleId]: json.permissions[roleId],
    },
    scopes: {
      ...state.scopes,
      [roleId]: json.scopes[roleId],
    },
  }
}

export function RolesSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [data, setData] = useState<MatrixPayload | null>(null)
  const [draft, setDraft] = useState<MatrixPayload | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/roles")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load roles")
      setData(json)
      setDraft(json)
      setDirty(false)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const configurableColumns = useMemo(
    () => ROLE_IDS.filter((id) => CONFIGURABLE_ROLES.includes(id)),
    [],
  )

  function setPermission(roleId: RoleId, key: PermissionKey, enabled: boolean) {
    if (!draft || isLockedRole(roleId)) return
    setDraft({
      ...draft,
      permissions: {
        ...draft.permissions,
        [roleId]: { ...draft.permissions[roleId], [key]: enabled },
      },
    })
    setDirty(true)
  }

  function setAssessmentScope(roleId: RoleId, scope: AssessmentViewScope) {
    if (!draft || isLockedRole(roleId)) return
    setDraft({
      ...draft,
      scopes: {
        ...draft.scopes,
        [roleId]: { ...draft.scopes[roleId], assessment_view_scope: scope },
      },
    })
    setDirty(true)
  }

  function setReviewerScope(roleId: RoleId, scope: ReviewerScope) {
    if (!draft || isLockedRole(roleId)) return
    setDraft({
      ...draft,
      scopes: {
        ...draft.scopes,
        [roleId]: { ...draft.scopes[roleId], reviewer_scope: scope },
      },
    })
    setDirty(true)
  }

  async function saveAll() {
    if (!draft) return
    setSaving(true)
    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: Object.fromEntries(
            CONFIGURABLE_ROLES.map((roleId) => [
              roleId,
              draft.permissions[roleId],
            ]),
          ),
          scopes: Object.fromEntries(
            CONFIGURABLE_ROLES.map((roleId) => [roleId, draft.scopes[roleId]]),
          ),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save")
      toast.success("Role permissions saved")
      setData((prev) =>
        prev
          ? { ...prev, permissions: json.permissions, scopes: json.scopes }
          : prev,
      )
      setDraft((prev) =>
        prev
          ? { ...prev, permissions: json.permissions, scopes: json.scopes }
          : prev,
      )
      setDirty(false)
    } catch (err) {
      toast.error((err as Error).message)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function resetRole(roleId: RoleId) {
    try {
      const res = await fetch("/api/roles/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Reset failed")
      toast.success(`${roleId} reset to defaults`)
      setData((prev) => {
        if (!prev) return prev
        const nextData = mergeRoleFromServer(prev, roleId, json)
        setDraft((prevDraft) => {
          if (!prevDraft) return prevDraft
          const nextDraft = mergeRoleFromServer(prevDraft, roleId, json)
          setDirty(isMatrixDirty(nextDraft, nextData))
          return nextDraft
        })
        return nextData
      })
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  function discard() {
    setDraft(data)
    setDirty(false)
  }

  function renderCell(
    roleId: RoleId,
    row: MatrixPayload["domains"][number]["rows"][number],
  ) {
    if (!draft) return null
    if (isLockedRole(roleId)) {
      return <Lock className="mx-auto size-4 text-pine/60" />
    }

    if (row.kind === "assessment_scope") {
      if (roleId === "reviewer" || roleId === "billing_manager") {
        return <span className="text-xs text-ink-muted">—</span>
      }
      return (
        <ScopeRadio
          name={`scope-${roleId}-assessment`}
          value={draft.scopes[roleId].assessment_view_scope}
          options={[
            { value: "all", label: "All" },
            { value: "assigned", label: "Assigned" },
          ]}
          onChange={(v) => setAssessmentScope(roleId, v)}
        />
      )
    }

    if (row.kind === "reviewer_scope") {
      if (roleId !== "reviewer") {
        return <span className="text-xs text-ink-muted">—</span>
      }
      return (
        <ScopeRadio
          name="scope-reviewer-visibility"
          value={draft.scopes.reviewer.reviewer_scope}
          options={[
            { value: "all", label: "All" },
            { value: "shared", label: "Shared" },
          ]}
          onChange={(v) => setReviewerScope("reviewer", v)}
        />
      )
    }

    return (
      <Switch
        checked={draft.permissions[roleId][row.key as PermissionKey]}
        onCheckedChange={(checked) =>
          setPermission(roleId, row.key as PermissionKey, checked)
        }
      />
    )
  }

  return (
    <RecruiterShell title="Settings" subtitle="Roles & permissions">
      <SettingsLayout>
        <div className="flex flex-col gap-6 pb-24">
          <Card className="overflow-hidden border-pine/20 bg-pine text-pine-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Roles &amp; permissions</CardTitle>
              <CardDescription className="text-pine-foreground/80">
                Control exactly what each role can see and do across your
                workspace.
              </CardDescription>
            </CardHeader>
          </Card>

          <p className="rounded-lg border border-sage-line/70 bg-paper-deep px-4 py-3 text-sm text-ink-muted">
            <strong className="text-ink">Admin</strong> and{" "}
            <strong className="text-ink">Owner</strong> always have full access
            — their permissions are not configurable here. Toggle which features
            each other role can use, then save.
          </p>

          {loading || !draft ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-ink-muted" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-sage-line/70 bg-card">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b border-sage-line/70 bg-paper-deep">
                      <th className="px-4 py-3 text-left font-medium text-ink-muted">
                        Feature
                      </th>
                      {ROLE_IDS.map((roleId) => (
                        <th
                          key={roleId}
                          className="px-3 py-3 text-center font-medium"
                        >
                          {isLockedRole(roleId) ? (
                            <div className="flex flex-col items-center gap-1 text-pine">
                              <Lock className="size-3.5" />
                              <span>{draft.roles.find((r) => r.id === roleId)?.label}</span>
                              <span className="text-[10px] font-normal uppercase tracking-wide">
                                Full access
                              </span>
                            </div>
                          ) : (
                            draft.roles.find((r) => r.id === roleId)?.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {draft.domains.map((domain) => (
                      <Fragment key={domain.id}>
                        <tr className="bg-paper-deep/60">
                          <td
                            colSpan={ROLE_IDS.length + 1}
                            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                          >
                            {domain.label}
                          </td>
                        </tr>
                        {domain.rows.map((row) => (
                          <tr
                            key={String(row.key)}
                            className="border-t border-sage-line/40"
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-ink">{row.label}</div>
                              <div className="text-xs text-ink-muted">
                                {row.description}
                              </div>
                            </td>
                            {ROLE_IDS.map((roleId) => (
                              <td
                                key={roleId}
                                className="px-3 py-3 text-center align-top"
                              >
                                {renderCell(roleId, row)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick presets</CardTitle>
                  <CardDescription>
                    Apply a preset to reset a role&apos;s permissions to a common
                    configuration. You can further customize above after applying.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {configurableColumns.map((roleId) => (
                    <Button
                      key={roleId}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void resetRole(roleId)}
                    >
                      Reset {draft.roles.find((r) => r.id === roleId)?.label} to
                      default
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sage-line/70 bg-card/95 px-4 py-3 backdrop-blur lg:pl-[calc(272px+2.5rem)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="text-sm text-ink-muted">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!dirty || saving}
                onClick={discard}
              >
                Discard
              </Button>
              <Button
                type="button"
                className="bg-pine text-pine-foreground hover:bg-pine-deep"
                disabled={!dirty || saving}
                onClick={() => void saveAll()}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </SettingsLayout>
    </RecruiterShell>
  )
}
