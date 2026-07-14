import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * A single settings row: a label + optional helper text on the left, and a
 * control (input, switch, button, badge…) on the right. Matches the scannable
 * "label · description · control" pattern used across the settings area.
 */
export function SettingRow({
  title,
  description,
  control,
  htmlFor,
  className,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  /** Right-aligned control. Alias for `children`. */
  control?: ReactNode
  htmlFor?: string
  className?: string
  children?: ReactNode
}) {
  const right = control ?? children
  const LabelTag = htmlFor ? "label" : "div"

  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className,
      )}
    >
      <LabelTag
        {...(htmlFor ? { htmlFor } : {})}
        className="min-w-0 space-y-0.5"
      >
        <div className="text-sm font-medium text-ink">{title}</div>
        {description ? (
          <div className="text-xs text-ink-muted">{description}</div>
        ) : null}
      </LabelTag>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

/** Divides SettingRows with hairlines, like a settings list. */
export function SettingList({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("divide-y divide-sage-line/60", className)}>
      {children}
    </div>
  )
}
