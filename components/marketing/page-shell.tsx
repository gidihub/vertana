import type { ReactNode } from "react"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { SiteFooter } from "@/components/marketing/site-footer"

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-paper font-sans text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-pine focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-pine-foreground"
      >
        Skip to content
      </a>
      <MarketingNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  )
}
