import type { QuestionType } from "@/lib/types"

export interface ScoreDistributionBucket {
  label: string
  count: number
  pct: number
  color: string
}

const BUCKET_COLORS = {
  low: "oklch(0.63 0.19 25)",
  mid: "oklch(0.74 0.14 65)",
  high: "oklch(0.55 0.14 145)",
} as const

export function toScoreDistribution(
  buckets: { label: string; count: number }[],
  type: QuestionType,
  total: number,
): ScoreDistributionBucket[] {
  const counts = [0, 0, 0]

  if (type === "coding") {
    for (const bucket of buckets) {
      if (bucket.label === "0%") counts[0] += bucket.count
      else if (bucket.label === "1–49%" || bucket.label === "50–99%") {
        counts[1] += bucket.count
      } else if (bucket.label === "100%") counts[2] += bucket.count
    }
  } else {
    for (const bucket of buckets) {
      if (bucket.label === "Incorrect") counts[0] += bucket.count
      else if (bucket.label === "Ungraded") counts[1] += bucket.count
      else if (bucket.label === "Correct") counts[2] += bucket.count
    }
  }

  const labels = ["0–33%", "34–67%", "68–100%"]
  const colors = [BUCKET_COLORS.low, BUCKET_COLORS.mid, BUCKET_COLORS.high]

  return labels.map((label, index) => ({
    label,
    count: counts[index],
    pct: total > 0 ? Math.round((counts[index] / total) * 100) : 0,
    color: colors[index],
  }))
}
