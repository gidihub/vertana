"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { libraryCategoryTree } from "@/lib/question-library/categories"
import { numericText } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

function CountBadge({
  value,
  onDark = false,
}: {
  value: number
  onDark?: boolean
}) {
  return (
    <span
      className={cn(
        "shrink-0 text-[10px] leading-none",
        onDark ? "text-[var(--on-primary)]/80" : "text-[var(--text-muted)]",
        numericText,
      )}
    >
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
    <aside className="flex w-full shrink-0 flex-col lg:w-56">
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Categories
      </p>
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/80",
          active === ""
            ? "bg-[var(--fill-primary)] font-medium text-[var(--on-primary)] hover:bg-pine-deep"
            : "font-normal text-[var(--text-secondary)]",
        )}
      >
        <span>All questions</span>
        <CountBadge value={total} onDark={active === ""} />
      </button>

      {tree.map((parent, index) => {
        const isOpen = expanded[parent.id] ?? true
        const parentCount = counts[parent.id] ?? 0
        const parentActive = active === parent.id

        return (
          <div
            key={parent.id}
            className={cn(
              "flex flex-col",
              index > 0 && "mt-4 border-t border-[var(--border-strong)] pt-4",
            )}
          >
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
                className="rounded p-1 text-[var(--text-muted)] hover:bg-muted/80"
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
                  parentActive
                    ? "bg-pine/10 font-bold text-pine"
                    : "font-bold text-[var(--text-primary)]",
                )}
              >
                <span className="truncate">{parent.name}</span>
                <CountBadge value={parentCount} />
              </button>
            </div>

            {isOpen ? (
              <div className="mt-0.5 ml-6 flex flex-col border-l border-[var(--border-strong)] pl-2">
                {parent.children.map((child) => {
                  const childCount = counts[child.id] ?? 0
                  const childActive = active === child.id
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child.id)}
                      className={cn(
                        "flex items-center justify-between rounded-md py-1.5 pr-1 pl-2.5 text-left text-sm transition-colors hover:bg-muted/80",
                        childActive
                          ? "bg-pine/10 font-medium text-pine"
                          : "font-normal text-[var(--text-secondary)]",
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
