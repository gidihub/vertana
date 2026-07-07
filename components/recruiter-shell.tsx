import Link from "next/link"
import type { ReactNode } from "react"
import { SquareCheckBig } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function RecruiterShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <SquareCheckBig className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">Vertana</span>
            <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">
              Assessments
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Acme Talent
            </span>
            <Avatar className="size-8">
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                AT
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
