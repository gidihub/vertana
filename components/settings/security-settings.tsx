"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface TotpFactor {
  id: string
  status: "verified" | "unverified"
}

export function SecuritySettings() {
  const router = useRouter()
  const supabase = createClient()

  const [factors, setFactors] = useState<TotpFactor[]>([])
  const [loadingFactors, setLoadingFactors] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  // Enrollment dialog state
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)

  const verifiedFactor = factors.find((f) => f.status === "verified") ?? null

  const loadFactors = useCallback(async () => {
    setLoadingFactors(true)
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      const totp = (data?.totp ?? []) as TotpFactor[]
      setFactors(totp)
    } catch {
      // Leave empty; the UI will offer enrollment.
    } finally {
      setLoadingFactors(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadFactors()
  }, [loadFactors])

  async function startEnroll() {
    setBusy("enroll")
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
      })
      if (error) throw error
      setEnrollFactorId(data.id)
      setQr(data.totp.qr_code)
      setSecret(data.totp.secret)
      setCode("")
      setEnrollOpen(true)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function confirmEnroll() {
    if (!enrollFactorId) return
    setVerifying(true)
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollFactorId,
        code: code.trim(),
      })
      if (error) throw error
      toast.success("Two-factor authentication enabled")
      setEnrollOpen(false)
      await loadFactors()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  async function disable2fa() {
    if (!verifiedFactor) return
    setBusy("disable")
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      })
      if (error) throw error
      toast.success("Two-factor authentication disabled")
      await loadFactors()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function sendPasswordReset() {
    setBusy("password")
    try {
      const { data: userData } = await supabase.auth.getUser()
      const email = userData.user?.email
      if (!email) throw new Error("No email on file")
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
      })
      if (error) throw error
      toast.success("Password reset link sent to your email")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function signOutOthers() {
    setBusy("others")
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" })
      if (error) throw error
      toast.success("Signed out of all other sessions")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function signOut() {
    setBusy("signout")
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" })
      if (!res.ok) throw new Error("Sign out failed")
      router.push("/login")
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
      setBusy(null)
    }
  }

  return (
    <RecruiterShell title="Settings" subtitle="Security">
      <SettingsLayout>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>
                Keep your account and your candidate data safe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingList>
                <SettingRow
                  title={
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-ink-muted" />
                      Two-factor authentication
                    </span>
                  }
                  description="Require a time-based code from an authenticator app at sign-in."
                  control={
                    loadingFactors ? (
                      <Loader2 className="size-4 animate-spin text-ink-muted" />
                    ) : verifiedFactor ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Enabled</Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy !== null}
                          onClick={() => void disable2fa()}
                        >
                          {busy === "disable" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            "Disable"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => void startEnroll()}
                      >
                        {busy === "enroll" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Set up"
                        )}
                      </Button>
                    )
                  }
                />
                <SettingRow
                  title={
                    <span className="flex items-center gap-2">
                      <KeyRound className="size-4 text-ink-muted" />
                      Password
                    </span>
                  }
                  description="We'll email you a secure link to set a new password."
                  control={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => void sendPasswordReset()}
                    >
                      {busy === "password" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  }
                />
                <SettingRow
                  title={
                    <span className="flex items-center gap-2">
                      <MonitorSmartphone className="size-4 text-ink-muted" />
                      Active sessions
                    </span>
                  }
                  description="Sign out everywhere except this device."
                  control={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => void signOutOthers()}
                    >
                      {busy === "others" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Sign out other devices"
                      )}
                    </Button>
                  }
                />
              </SettingList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">This device</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingList>
                <SettingRow
                  title={
                    <span className="flex items-center gap-2">
                      <LogOut className="size-4 text-ink-muted" />
                      Sign out
                    </span>
                  }
                  description="End your session on this device."
                  control={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => void signOut()}
                    >
                      {busy === "signout" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Sign out"
                      )}
                    </Button>
                  }
                />
              </SettingList>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with an authenticator app (Google Authenticator,
              1Password, Authy), then enter the 6-digit code to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {qr ? (
              // Supabase returns an SVG data URI for the QR code.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="Two-factor QR code"
                className="size-44 rounded-lg bg-white p-2 ring-1 ring-foreground/10"
              />
            ) : null}
            {secret ? (
              <p className="text-center text-xs text-ink-muted">
                Or enter this key manually:
                <br />
                <span className="font-mono text-[11px] break-all text-ink">
                  {secret}
                </span>
              </p>
            ) : null}
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-40 text-center tracking-[0.3em]"
              maxLength={6}
            />
            <Button
              type="button"
              className="w-full"
              disabled={code.trim().length < 6 || verifying}
              onClick={() => void confirmEnroll()}
            >
              {verifying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Verify & enable"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </RecruiterShell>
  )
}
