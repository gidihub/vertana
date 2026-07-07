"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AuthShell } from "@/components/auth-shell"
import { createClient } from "@/lib/supabase/client"
import { displayHeading, linkClass } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
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
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    <AuthShell>
      <Card className="w-full max-w-md border-sage-line/80 shadow-sm">
        <CardHeader>
          <CardTitle className={cn(displayHeading, "text-2xl")}>
            Create your Vertana account
          </CardTitle>
          <CardDescription className="text-ink-muted">
            Start building assessments for your hiring team.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="org">Organization name</FieldLabel>
              <Input
                id="org"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Talent"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="h-10 w-full rounded-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-ink-muted">
              Already have an account?{" "}
              <Link href="/login" className={linkClass}>
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  )
}
