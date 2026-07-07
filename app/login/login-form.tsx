"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`
      }

      await fetch("/api/auth/setup", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({}),
      })

      router.push(next)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-md border-sage-line/80 shadow-sm">
        <CardHeader>
          <CardTitle className={cn(displayHeading, "text-2xl")}>
            Sign in to Vertana
          </CardTitle>
          <CardDescription className="text-ink-muted">
            Access your assessments and candidate results.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
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
                autoComplete="current-password"
              />
            </Field>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="h-10 w-full rounded-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-ink-muted">
              No account?{" "}
              <Link href="/signup" className={linkClass}>
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  )
}
