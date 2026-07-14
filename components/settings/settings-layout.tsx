"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  User,
  Bell,
  ShieldCheck,
  CreditCard,
  Users,
  Plug,
  Database,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: LucideIcon }

const ACCOUNT_NAV: NavItem[] = [
  { href: "/settings", label: "Profile", icon: User },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/security", label: "Security", icon: ShieldCheck },
]

const ORG_NAV: NavItem[] = [
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/settings/data", label: "Data & privacy", icon: Database },
]

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string
  items: NavItem[]
  pathname: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              active
                ? "bg-pine/10 font-medium text-pine"
                : "text-ink hover:bg-paper/70",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

/**
 * Two-column settings chrome: a section rail (Account vs Organization) plus the
 * active page's content. Rendered inside RecruiterShell by each settings page.
 */
export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:gap-10">
      <nav
        aria-label="Settings sections"
        className="flex shrink-0 flex-col gap-5 lg:sticky lg:top-4 lg:w-52 lg:self-start"
      >
        <NavGroup label="Account" items={ACCOUNT_NAV} pathname={pathname} />
        <NavGroup label="Organization" items={ORG_NAV} pathname={pathname} />
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
