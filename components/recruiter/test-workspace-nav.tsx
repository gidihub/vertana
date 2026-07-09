"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Pencil } from "lucide-react"

import { cn } from "@/lib/utils"

export function TestWorkspaceNav({ testId }: { testId: string }) {
  const pathname = usePathname()
  const isEdit = pathname === `/tests/${testId}/edit`
  const isResults = pathname === `/tests/${testId}/results`

  const tabs = [
    {
      href: `/tests/${testId}/edit`,
      label: "Edit test",
      icon: Pencil,
      active: isEdit,
    },
    {
      href: `/tests/${testId}/results`,
      label: "Results",
      icon: BarChart3,
      active: isResults,
    },
  ] as const

  return (
    <nav
      className="mb-6 flex gap-1 border-b border-sage-line/70"
      aria-label="Test sections"
    >
      {tabs.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors -mb-px",
            active
              ? "border-pine text-pine"
              : "border-transparent text-ink-muted hover:border-sage-line hover:text-ink",
          )}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
