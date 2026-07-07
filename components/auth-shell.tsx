import Link from "next/link"
import type { ReactNode } from "react"

import { Logo } from "@/components/logo"
import { appHeader, appShell } from "@/lib/design-tokens"

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${appShell} flex flex-col`}>
      <header className={appHeader}>
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <Link
            href="/"
            aria-label="Vertana home"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <Logo size={30} />
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
