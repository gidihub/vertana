import type { LucideIcon } from "lucide-react"

import { CandidateHeader } from "@/components/candidate/candidate-header"
import { appShell, displayHeading } from "@/lib/design-tokens"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

// A single, consistent surface for every candidate-facing terminal state
// (invalid link, expired, closed, already submitted). States what happened in
// the product's own voice — no apology, no raw errors.
export function CandidateMessage({
  icon: Icon,
  tone = "neutral",
  title,
  children,
}: {
  icon: LucideIcon
  tone?: "neutral" | "positive"
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={appShell}>
      <CandidateHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-sage-line/80 text-center shadow-sm">
        <CardHeader className="items-center">
          <div
            className={
              tone === "positive"
                ? "mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"
                : "mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            }
          >
            <Icon className="size-7" aria-hidden />
          </div>
          <CardTitle className={cn(displayHeading, "text-balance text-xl")}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-pretty text-sm/relaxed text-muted-foreground">
          {children}
        </CardContent>
      </Card>
      </main>
    </div>
  )
}
