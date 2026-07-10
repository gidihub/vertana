import { ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { dangerSurface, warningSurface } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

export function IntegrityConcernBadge({
  compact = false,
  className,
  variant = "danger",
}: {
  compact?: boolean
  className?: string
  /** danger = red integrity flag; warning = amber (legacy surfaces) */
  variant?: "danger" | "warning"
}) {
  const label = compact ? "Integrity" : "Integrity concern"
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        variant === "danger" ? dangerSurface : warningSurface,
        className,
      )}
      title="Candidate left the assessment window multiple times during the session"
    >
      <ShieldAlert className="size-3" />
      {label}
    </Badge>
  )
}
