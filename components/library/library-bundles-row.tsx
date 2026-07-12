"use client"

import { ListChecks, Clock } from "lucide-react"

import type { LibraryBundle } from "@/lib/question-library/bundles"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

export function LibraryBundlesRow({
  bundles,
  onUseBundle,
}: {
  bundles: LibraryBundle[]
  onUseBundle: (bundle: LibraryBundle) => void
}) {
  if (bundles.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        Recommended bundles
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {bundles.map((bundle) => (
          <Card
            key={bundle.id}
            className="flex flex-col border-[var(--border-strong)] bg-card shadow-none"
          >
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              <div>
                <p className="text-base font-medium leading-snug text-[var(--text-primary)]">
                  {bundle.title}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-[var(--text-secondary)]">
                  {bundle.description}
                </p>
              </div>
              <div
                className={cn(
                  "flex flex-wrap gap-3 text-[13px] text-[var(--text-secondary)]",
                  numericText,
                )}
              >
                <span className="inline-flex items-center gap-1.5 font-sans">
                  <ListChecks className="size-[15px] shrink-0" />
                  {bundle.questionCount} questions
                </span>
                <span className="inline-flex items-center gap-1.5 font-sans">
                  <Clock className="size-[15px] shrink-0" />~
                  {bundle.estimatedMinutes} min
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-auto w-full bg-[var(--fill-primary)] text-[var(--on-primary)] hover:bg-pine-deep"
                onClick={() => onUseBundle(bundle)}
              >
                Use bundle
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
