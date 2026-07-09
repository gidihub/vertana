"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Pin,
  Plus,
  Users,
  UserRound,
  Settings,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  LayoutGrid,
  BookOpen,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"

import type { Test, TestStatus } from "@/lib/types"
import { setTestPinned, useStore } from "@/lib/store"
import { Logo, LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { SidebarUsageWidget } from "@/components/recruiter/sidebar-usage-widget"
import { cn } from "@/lib/utils"

const STATUS_DOT: Record<TestStatus, string> = {
  active: "bg-pine",
  draft: "bg-ink-muted/40",
  closed: "bg-ink-muted/25",
}

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Tests", icon: LayoutGrid },
  { href: "/candidates", label: "Candidates", icon: UserRound },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const

function TestSidebarItem({
  test,
  active,
  collapsed,
  onNavigate,
}: {
  test: Test
  active: boolean
  collapsed?: boolean
  onNavigate?: () => void
}) {
  async function togglePin(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await setTestPinned(test.id, !test.is_pinned)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  if (collapsed) {
    return (
      <Link
        href={`/tests/${test.id}/edit`}
        onClick={onNavigate}
        title={test.title}
        className={cn(
          "flex size-9 items-center justify-center rounded-md transition-colors",
          active ? "bg-pine/10 text-pine" : "text-ink hover:bg-paper/70",
        )}
      >
        <span
          className={cn("size-2.5 rounded-full", STATUS_DOT[test.status])}
          aria-hidden
        />
        <span className="sr-only">{test.title}</span>
      </Link>
    )
  }

  return (
    <div className="group relative">
      <Link
        href={`/tests/${test.id}/edit`}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 pr-8 text-sm transition-colors",
          active
            ? "bg-pine/10 font-medium text-pine"
            : "text-ink hover:bg-paper/70",
        )}
      >
        <span
          className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[test.status])}
          aria-hidden
        />
        <span className="truncate">{test.title}</span>
      </Link>
      <button
        type="button"
        onClick={(e) => void togglePin(e)}
        aria-label={test.is_pinned ? "Unpin test" : "Pin test"}
        className={cn(
          "absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-opacity hover:bg-paper/80 hover:text-pine",
          test.is_pinned
            ? "opacity-100 text-pine"
            : "opacity-0 group-hover:opacity-100",
        )}
      >
        <Pin className={cn("size-3.5", test.is_pinned && "fill-current")} />
      </button>
    </div>
  )
}

function SidebarIconButton({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href?: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
  onClick?: () => void
}) {
  const className = cn(
    "flex size-9 items-center justify-center rounded-md transition-colors",
    active ? "bg-pine/10 text-pine" : "text-ink hover:bg-paper/70",
  )

  if (href) {
    return (
      <Link href={href} title={label} className={className} onClick={onClick}>
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </Link>
    )
  }

  return (
    <button type="button" title={label} className={className} onClick={onClick}>
      <Icon className="size-4" />
      <span className="sr-only">{label}</span>
    </button>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  collapsed?: boolean
  onNavigate?: () => void
}) {
  if (collapsed) {
    return (
      <SidebarIconButton
        href={href}
        icon={Icon}
        label={label}
        active={active}
        onClick={onNavigate}
      />
    )
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
        active ? "bg-pine/10 text-pine" : "text-ink hover:bg-paper/70",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  )
}

export function SidebarNav({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onSignOut,
  userEmail,
}: {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
  onSignOut: () => void
  userEmail?: string | null
}) {
  const pathname = usePathname()
  const tests = useStore((db) => db.tests)
  const loading = useStore((db) => db.loading)

  const sorted = [...tests].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
  const pinned = sorted.filter((t) => t.is_pinned)

  function isTestActive(testId: string) {
    return (
      pathname === `/tests/${testId}/results` ||
      pathname === `/tests/${testId}/edit`
    )
  }

  function isNavActive(href: string) {
    if (href === "/dashboard") {
      return (
        pathname === "/dashboard" ||
        pathname.startsWith("/tests/") ||
        pathname === "/tests/new"
      )
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "shrink-0 border-b border-sage-line/60",
          collapsed ? "px-2 py-3" : "px-4 py-4",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          <Link
            href="/dashboard"
            onClick={onNavigate}
            aria-label="Vertana dashboard"
            className={cn(
              "inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9ebe5]",
              collapsed && "justify-center",
            )}
          >
            {collapsed ? (
              <LogoMark size={28} title="" />
            ) : (
              <Logo size={28} />
            )}
          </Link>
          {!collapsed && onToggleCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden size-8 shrink-0 text-ink-muted hover:text-ink lg:inline-flex"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>

        {collapsed ? (
          <Button
            className="mt-3 size-9 bg-pine p-0 text-pine-foreground hover:bg-pine-deep"
            nativeButton={false}
            render={
              <Link href="/tests/new" onClick={onNavigate} title="Create test" />
            }
          >
            <Plus className="size-4" />
            <span className="sr-only">Create test</span>
          </Button>
        ) : (
          <Button
            className="mt-4 w-full bg-pine text-pine-foreground hover:bg-pine-deep"
            nativeButton={false}
            render={<Link href="/tests/new" onClick={onNavigate} />}
          >
            <Plus data-icon="inline-start" />
            Create test
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4",
          collapsed ? "items-center px-2" : "px-3",
        )}
      >
        <nav
          className={cn(
            "flex flex-col gap-0.5",
            collapsed && "items-center gap-1",
          )}
          aria-label="Main"
        >
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isNavActive(item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {!collapsed && pinned.length > 0 && (
          <section className="w-full border-t border-sage-line/50 pt-4">
            <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Pinned tests
            </h2>
            <div className="flex flex-col gap-0.5">
              {pinned.map((test) => (
                <TestSidebarItem
                  key={test.id}
                  test={test}
                  active={isTestActive(test.id)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>
        )}

        {collapsed && pinned.length > 0 && (
          <section className="flex max-h-48 flex-col items-center gap-1 overflow-y-auto border-t border-sage-line/50 pt-3">
            {pinned.slice(0, 8).map((test) => (
              <TestSidebarItem
                key={test.id}
                test={test}
                active={isTestActive(test.id)}
                collapsed
                onNavigate={onNavigate}
              />
            ))}
          </section>
        )}

        {loading && !collapsed ? (
          <p className="px-2 text-xs text-ink-muted">Loading tests…</p>
        ) : null}

        {collapsed ? (
          <SidebarIconButton
            href="/team"
            icon={Users}
            label="Team"
            active={pathname === "/team"}
            onClick={onNavigate}
          />
        ) : (
          <Link
            href="/team"
            onClick={onNavigate}
            className={cn(
              "mt-auto flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              pathname === "/team"
                ? "bg-pine/10 text-pine"
                : "text-ink hover:bg-paper/70",
            )}
          >
            <Users className="size-4" />
            Team
          </Link>
        )}
      </div>

      <div
        className={cn(
          "shrink-0 space-y-3 border-t border-sage-line/60 bg-[#e9ebe5] py-4",
          collapsed ? "flex flex-col items-center px-2" : "px-3",
        )}
      >
        {!collapsed && <SidebarUsageWidget compact />}

        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <SidebarIconButton
              href="/settings"
              icon={Settings}
              label="Account settings"
              active={pathname === "/settings"}
              onClick={onNavigate}
            />
            <a
              href="mailto:support@vertana.app"
              title="Contact support"
              className="flex size-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-paper/70"
            >
              <LifeBuoy className="size-4" />
              <span className="sr-only">Contact support</span>
            </a>
            <button
              type="button"
              title="Sign out"
              onClick={onSignOut}
              className="flex size-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-paper/70"
            >
              <LogOut className="size-4" />
              <span className="sr-only">Sign out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 text-sm">
            <Link
              href="/settings"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 transition-colors",
                pathname === "/settings"
                  ? "bg-pine/10 font-medium text-pine"
                  : "text-ink hover:bg-paper/70",
              )}
            >
              <Settings className="size-4" />
              Account settings
            </Link>
            <a
              href="mailto:support@vertana.app"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-ink transition-colors hover:bg-paper/70"
            >
              <LifeBuoy className="size-4" />
              Contact support
            </a>
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-ink transition-colors hover:bg-paper/70"
            >
              <LogOut className="size-4" />
              Sign out
              {userEmail ? (
                <span className="ml-auto truncate text-xs text-ink-muted">
                  {userEmail}
                </span>
              ) : null}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
