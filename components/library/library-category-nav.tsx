"use client"

import { LIBRARY_CATEGORIES } from "@/lib/question-library/seed-data"
import type { LibraryCategory } from "@/lib/types"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

export function LibraryCategoryNav({
  active,
  counts,
  total,
  onSelect,
}: {
  active: LibraryCategory | ""
  counts: Record<string, number>
  total: number
  onSelect: (id: LibraryCategory | "") => void
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 lg:w-52">
      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Skills & roles
      </p>
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "flex items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/80",
          active === "" && "bg-pine/10 font-medium text-pine",
        )}
      >
        <span>All roles</span>
        <span className={cn("text-xs text-muted-foreground", numericText)}>
          {total}
        </span>
      </button>
      {LIBRARY_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/80",
            active === cat.id && "bg-pine/10 font-medium text-pine",
          )}
        >
          <span>{cat.label}</span>
          <span className={cn("text-xs text-muted-foreground", numericText)}>
            {counts[cat.id] ?? 0}
          </span>
        </button>
      ))}
    </aside>
  )
}
