"use client"

import { ListChecks, Clock } from "lucide-react"

import type { LibraryBundle } from "@/lib/question-library/bundles"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
      <h2 className="text-sm font-semibold text-foreground">
        Recommended bundles
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {bundles.map((bundle) => (
          <Card key={bundle.id} className="flex flex-col">
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              <div>
                <p className="font-medium leading-snug">{bundle.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {bundle.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="size-3.5" />
                  {bundle.questionCount} questions
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />~{bundle.estimatedMinutes} min
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-auto w-full"
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
