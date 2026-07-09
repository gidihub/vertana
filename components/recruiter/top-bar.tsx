"use client"

import { Menu, PanelLeft, X } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function RecruiterTopBar({
  title,
  subtitle,
  actions,
  onMenuClick,
  menuOpen,
  sidebarCollapsed,
  onSidebarToggle,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  onMenuClick: () => void
  menuOpen: boolean
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-sage-line/70 bg-paper/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {sidebarCollapsed && onSidebarToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden shrink-0 lg:inline-flex"
            onClick={onSidebarToggle}
            aria-label="Expand sidebar"
          >
            <PanelLeft className="size-5" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onMenuClick}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-sans text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className={cn("flex shrink-0 items-center gap-2")}>{actions}</div>
      ) : null}
    </header>
  )
}
