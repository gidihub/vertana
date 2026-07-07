"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Coins, Sparkles, LogOut } from "lucide-react"

import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useOrganization } from "@/lib/store"
import { formatDate } from "@/lib/format"
import { aiLimitForTier, type PlanTier } from "@/lib/plans"
import { appHeader, appShell, linkClass } from "@/lib/design-tokens"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function RecruiterShell({ children }: { children: ReactNode }) {
  const org = useOrganization()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const aiLimit = org ? aiLimitForTier(org.plan_tier as PlanTier) : null

  return (
    <div className={appShell}>
      <header className={appHeader}>
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            aria-label="Vertana dashboard"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <Logo size={30} />
          </Link>

          <div className="flex items-center gap-3">
            {org && aiLimit !== null && (
              <Badge
                variant="outline"
                className="hidden gap-1.5 border-sage-line text-ink-muted sm:inline-flex"
              >
                <Sparkles className="size-3.5" />
                AI {org.ai_generations_used}/{aiLimit}
              </Badge>
            )}
            {org && (
              <Badge
                variant={org.credits_remaining > 0 ? "secondary" : "destructive"}
                className="hidden gap-1.5 sm:inline-flex"
              >
                <Coins className="size-3.5" />
                {org.credits_remaining} credit{org.credits_remaining === 1 ? "" : "s"} left
              </Badge>
            )}
            <span className="hidden text-sm text-ink-muted sm:inline">
              {email ?? org?.name ?? "Loading…"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void signOut()}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
            <Avatar className="size-8">
              <AvatarFallback className="bg-sage text-xs text-ink">
                {(org?.name ?? "V").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        {org && org.credits_remaining <= 0 && (
          <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2 text-center text-sm text-destructive">
            No candidate credits remaining.{" "}
            <Link href="/#pricing" className={linkClass}>
              Upgrade your plan
            </Link>{" "}
            or wait until {formatDate(org.credits_reset_at)} for your monthly reset.
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
