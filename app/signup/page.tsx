"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { appShell, linkClass } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

function authErrorMessage(message: string): string {
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many signup attempts from Supabase. Wait a few minutes, try signing in instead, or raise the limit in Supabase → Authentication → Rate Limits."
  }
  return message
}

async function runOrgSetup(input: {
  orgName: string
  accessToken?: string | null
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (input.accessToken) {
    headers.Authorization = `Bearer ${input.accessToken}`
  }

  const res = await fetch("/api/auth/setup", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ orgName: input.orgName }),
  })

  const data = (await res.json()) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Could not set up organization")
  }
}

export default function SignupPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      if (!data.session) {
        toast.success("Account created — check your email to confirm, then sign in.")
        router.push("/login")
        return
      }

      await runOrgSetup({
        orgName: orgName.trim() || "My Organization",
        accessToken: data.session.access_token,
      })

      toast.success("Account created")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error(authErrorMessage((err as Error).message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(appShell, "flex min-h-svh flex-col items-center justify-center px-4 py-12")}>
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={32} className="mb-3" />
        <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
          AI-resistant skills assessments for hiring teams
        </p>
      </div>

      <div className="w-full max-w-[420px] rounded-2xl border border-sage-line/80 bg-card px-8 py-10 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Fill in your details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="org">Organization name</FieldLabel>
            <Input
              id="org"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Talent"
              required
              className="h-10"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="h-10"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-ink-muted transition-colors hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((open) => !open)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-ink-muted transition-colors hover:text-ink"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-muted">
            <Checkbox
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className={cn(linkClass, "font-medium")}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className={cn(linkClass, "font-medium")}>
                Privacy Policy
              </Link>
              , including how Vertana processes my data.
            </span>
          </label>

          <Button
            type="submit"
            className="h-10 w-full rounded-lg bg-pine text-pine-foreground hover:bg-pine-deep"
            disabled={loading || !acceptedTerms}
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className={cn(linkClass, "font-semibold")}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
