"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
} from "lucide-react"

import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

const NAV: Array<{
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}> = [
  { href: "/cms", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/cms/blog", label: "Blog", icon: FileText },
  { href: "/cms/authors", label: "Authors", icon: Users },
  { href: "/cms/announcements", label: "Announcements", icon: Megaphone },
  { href: "/cms/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/cms/users", label: "Analytics", icon: BarChart3 },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function CmsSidebar({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-svh w-[272px] shrink-0 flex-col border-r border-sage-line/70 bg-paper-deep"
      aria-label="CMS navigation"
    >
      <div className="border-b border-sage-line/60 px-4 py-5">
        <Link
          href="/cms"
          className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper-deep"
        >
          <Logo className="h-7" />
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-pine">
          Staff CMS
        </p>
        <p className="mt-1 truncate text-xs text-ink-muted">{email}</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-pine/10 font-medium text-pine"
                  : "text-ink hover:bg-paper/70",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sage-line/60 px-4 py-4">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-ink-muted transition-colors hover:text-pine"
        >
          ← Back to dashboard
        </Link>
      </div>
    </aside>
  )
}
