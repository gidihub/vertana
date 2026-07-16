"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

import { SidebarNav } from "@/components/recruiter/sidebar-nav"
import { RecruiterTopBar } from "@/components/recruiter/top-bar"
import { refreshStore, useOrganization } from "@/lib/store"
import { appShell, linkClass } from "@/lib/design-tokens"
import { readSidebarCollapsed, writeSidebarCollapsed } from "@/lib/sidebar-prefs"
import { formatDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function RecruiterShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  const org = useOrganization()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setSidebarCollapsed(readSidebarCollapsed())
  }, [])

  useEffect(() => {
    void refreshStore()
  }, [])

  useEffect(() => {
    // Local JWT verification (no GoTrue round-trip) — we only need the email
    // for display, not a server-validated user object.
    void createClient()
      .auth.getClaims()
      .then(({ data }) =>
        setEmail((data?.claims?.email as string | undefined) ?? null),
      )
      .catch(() => setEmail(null))
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [title])

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      writeSidebarCollapsed(next)
      return next
    })
  }

  return (
    <div className={cn(appShell, "flex h-svh overflow-hidden")}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-svh shrink-0 flex-col overflow-hidden border-r border-sage-line/70 bg-paper-deep transition-[width] duration-200 ease-in-out lg:flex",
          sidebarCollapsed ? "w-14" : "w-[272px]",
        )}
        aria-label="Main navigation"
        aria-expanded={!sidebarCollapsed}
      >
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onSignOut={() => void signOut()}
          userEmail={email}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col border-r border-sage-line/70 bg-paper-deep transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
        aria-hidden={!mobileOpen}
      >
        <SidebarNav
          onNavigate={() => setMobileOpen(false)}
          onSignOut={() => void signOut()}
          userEmail={email}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <RecruiterTopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          menuOpen={mobileOpen}
          onMenuClick={() => setMobileOpen((open) => !open)}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={toggleSidebar}
        />

        {org && !org.is_comp && org.credits_remaining <= 0 && (
          <div className="border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-center text-sm text-destructive sm:px-6">
            No candidate credits remaining.{" "}
            <Link href="/#pricing" className={linkClass}>
              Upgrade your plan
            </Link>{" "}
            or wait until {formatDate(org.credits_reset_at)} for your monthly reset.
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
