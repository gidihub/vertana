"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/logo"

const NAV_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how" },
  { label: "AI checker", href: "/tools/ai-solvability-checker" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/#faq" },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-sage-line/70 bg-paper/85 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Vertana home"
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <Logo size={30} />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Get started
            </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-10 items-center justify-center rounded-md text-ink md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-sage-line/70 bg-paper md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-ink-muted hover:bg-sage hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-full border border-sage-line px-4 py-2 text-center text-sm font-medium text-ink hover:bg-sage"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-pine px-4 py-2 text-center text-sm font-semibold text-pine-foreground hover:bg-pine-deep"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
