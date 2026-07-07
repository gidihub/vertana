import type { AiResistance } from "@/lib/types"

const STYLES: Record<
  AiResistance,
  { label: string; className: string; description: string }
> = {
  low: {
    label: "Low resistance",
    className: "border-red-200 bg-red-50 text-red-800",
    description: "Easily answered with generic AI knowledge",
  },
  medium: {
    label: "Medium resistance",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    description: "Requires applied reasoning or context",
  },
  high: {
    label: "High resistance",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    description: "Hard to solve without live context or artifacts",
  },
}

export function AiResistanceBadge({
  level = "medium",
  compact,
}: {
  level?: AiResistance
  compact?: boolean
}) {
  const style = STYLES[level]
  return (
    <span
      title={style.description}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {compact ? level : style.label}
    </span>
  )
}
