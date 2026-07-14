import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TestStatus, CandidateStatus } from "@/lib/types"
import { CANDIDATE_STATUS_LABELS } from "@/lib/format"

const testStatusStyles: Record<TestStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active:
    "bg-[color-mix(in_oklch,var(--chart-3)_18%,transparent)] text-[color-mix(in_oklch,var(--chart-3)_60%,var(--foreground))]",
  closed: "bg-muted text-muted-foreground line-through",
}

const testStatusLabels: Record<TestStatus, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
}

export function TestStatusBadge({ status }: { status: TestStatus }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", testStatusStyles[status])}>
      {testStatusLabels[status]}
    </Badge>
  )
}

const candidateStatusStyles: Record<CandidateStatus, string> = {
  invited: "bg-muted text-muted-foreground",
  in_progress:
    "bg-[color-mix(in_oklch,var(--chart-4)_20%,transparent)] text-[color-mix(in_oklch,var(--chart-4)_55%,var(--foreground))]",
  submitted:
    "bg-[color-mix(in_oklch,var(--chart-3)_18%,transparent)] text-[color-mix(in_oklch,var(--chart-3)_60%,var(--foreground))]",
  expired: "bg-[color-mix(in_oklch,var(--destructive)_15%,transparent)] text-destructive",
}

export function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <Badge variant="secondary" className={cn(candidateStatusStyles[status])}>
      {CANDIDATE_STATUS_LABELS[status]}
    </Badge>
  )
}

const passFailStyles = {
  pass: "bg-[color-mix(in_oklch,var(--chart-3)_18%,transparent)] text-[color-mix(in_oklch,var(--chart-3)_60%,var(--foreground))]",
  fail: "bg-[color-mix(in_oklch,var(--destructive)_15%,transparent)] text-destructive",
} as const

export function PassFailBadge({
  result,
  className,
}: {
  result: "pass" | "fail"
  className?: string
}) {
  return (
    <Badge variant="secondary" className={cn(passFailStyles[result], className)}>
      {result === "pass" ? "Pass" : "Fail"}
    </Badge>
  )
}
