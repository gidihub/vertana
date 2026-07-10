"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DISPOSITION_LABELS, DISPOSITION_OPTIONS } from "@/lib/disposition"
import { updateCandidateDisposition } from "@/lib/store"
import type { Candidate, CandidateDisposition } from "@/lib/types"
import { cn } from "@/lib/utils"

const dispositionStyles: Record<CandidateDisposition, string> = {
  under_review: "bg-muted text-muted-foreground",
  shortlisted:
    "bg-[color-mix(in_oklch,var(--chart-2)_22%,transparent)] text-[color-mix(in_oklch,var(--chart-2)_55%,var(--foreground))]",
  rejected:
    "bg-[color-mix(in_oklch,var(--chart-5)_18%,transparent)] text-[color-mix(in_oklch,var(--chart-5)_60%,var(--foreground))]",
  hired:
    "bg-[color-mix(in_oklch,var(--chart-3)_18%,transparent)] text-[color-mix(in_oklch,var(--chart-3)_60%,var(--foreground))]",
}

export function CandidateDispositionBadge({
  disposition = "under_review",
}: {
  disposition?: CandidateDisposition
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(dispositionStyles[disposition])}
    >
      {DISPOSITION_LABELS[disposition]}
    </Badge>
  )
}

export function CandidateDispositionSelect({
  candidate,
  compact = false,
  onUpdated,
}: {
  candidate: Pick<Candidate, "id" | "test_id" | "disposition">
  compact?: boolean
  onUpdated?: (candidate: Candidate) => void
}) {
  const [saving, setSaving] = useState(false)
  const disposition = candidate.disposition ?? "under_review"

  async function handleChange(value: string | null) {
    const next = value as CandidateDisposition | null
    if (!next || next === disposition) return

    setSaving(true)
    try {
      const updated = await updateCandidateDisposition({
        testId: candidate.test_id,
        attemptId: candidate.id,
        disposition: next,
      })
      onUpdated?.(updated)
      toast.success(`Marked as ${DISPOSITION_LABELS[next].toLowerCase()}`)
    } catch (err) {
      toast.error((err as Error).message || "Could not update disposition")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", compact && "min-w-0")}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Select
        value={disposition}
        onValueChange={(v) => void handleChange(v)}
        disabled={saving}
      >
        <SelectTrigger
          className={cn(
            "bg-background",
            compact ? "h-7 w-[9.5rem] text-xs" : "w-full",
          )}
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {DISPOSITION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
