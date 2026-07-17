"use client"

import { RANGE_OPTIONS, type RangeKey } from "@/lib/dashboard/filters"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const items = Object.fromEntries(RANGE_OPTIONS.map((o) => [o.key, o.label]))

/** Shared time-range picker used by the org analytics and dashboard surfaces. */
export function DateRangeSelect({
  value,
  onChange,
  className,
}: {
  value: RangeKey
  onChange: (value: RangeKey) => void
  className?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange((v as RangeKey) || "all")}
      items={items}
    >
      <SelectTrigger className={className ?? "h-9 w-full min-w-0 sm:w-44"}>
        <SelectValue placeholder="Date range" />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
