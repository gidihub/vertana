"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { libraryCategoryTree } from "@/lib/question-library/categories"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

function CountBadge({ value }: { value: number }) {
  return (
    <span className={cn("text-xs text-muted-foreground", numericText)}>
      {value}
    </span>
  )
}

export function LibraryCategoryNav({
  active,
  counts,
  total,
  onSelect,
}: {
  active: string | ""
  counts: Record<string, number>
  total: number
  onSelect: (id: string | "") => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const parent of libraryCategoryTree()) {
      initial[parent.id] = true
    }
    return initial
  })

  const tree = libraryCategoryTree()

  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 lg:w-56">
      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Categories
      </p>
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "flex items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/80",
          active === "" && "bg-pine/10 font-medium text-pine",
        )}
      >
        <span>All questions</span>
        <CountBadge value={total} />
      </button>

      {tree.map((parent) => {
        const isOpen = expanded[parent.id] ?? true
        const parentCount = counts[parent.id] ?? 0
        const parentActive = active === parent.id

        return (
          <div key={parent.id} className="flex flex-col">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label={isOpen ? "Collapse" : "Expand"}
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [parent.id]: !isOpen,
                  }))
                }
                className="rounded p-1 text-muted-foreground hover:bg-muted/80"
              >
                {isOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onSelect(parent.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between rounded-md px-1.5 py-2 text-left text-sm transition-colors hover:bg-muted/80",
                  parentActive && "bg-pine/10 font-medium text-pine",
                )}
              >
                <span className="truncate">{parent.name}</span>
                <CountBadge value={parentCount} />
              </button>
            </div>

            {isOpen ? (
              <div className="ml-5 flex flex-col border-l border-border/60 pl-1">
                {parent.children.map((child) => {
                  const childCount = counts[child.id] ?? 0
                  const childActive = active === child.id
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child.id)}
                      className={cn(
                        "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/80",
                        childActive && "bg-pine/10 font-medium text-pine",
                      )}
                    >
                      <span className="truncate pr-2">{child.name}</span>
                      <CountBadge value={childCount} />
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </aside>
  )
}
