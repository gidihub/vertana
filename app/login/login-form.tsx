"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { AuthShell } from "@/components/auth-shell"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { linkClass } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function runOrgSetup(accessToken?: string | null) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    await fetch("/api/auth/setup", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({}),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      await runOrgSetup(data.session?.access_token)
      router.push(next)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      toast.message("Enter your email address first.")
      return
    }

    try {
      const supabase = createClient()
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/login`,
      })
      if (error) throw error
      toast.success("Check your email for a password reset link.")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })
      if (error) throw error
    } catch (err) {
      toast.error((err as Error).message)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="w-full max-w-[420px] rounded-2xl border border-sage-line/80 bg-card px-8 py-10 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={28} className="mb-6" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in to your Vertana account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-10"
            />
          </Field>

          <Field>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <FieldLabel htmlFor="password" className="mb-0">
                Password
              </FieldLabel>
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                className="text-xs font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          <Button
            type="submit"
            className="h-10 w-full rounded-lg"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-sage-line/80" />
          <span className="text-xs text-ink-muted">or continue with</span>
          <div className="h-px flex-1 bg-sage-line/80" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-lg border-sage-line bg-card text-ink hover:bg-paper-deep"
          disabled={googleLoading}
          onClick={() => void handleGoogleSignIn()}
        >
          <GoogleIcon className="size-4" />
          Continue with Google
        </Button>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={cn(linkClass, "font-semibold")}>
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
