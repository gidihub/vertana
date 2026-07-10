import type { CandidateDisposition } from "@/lib/types"

export const DISPOSITION_LABELS: Record<CandidateDisposition, string> = {
  under_review: "Under review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
}

export const DISPOSITION_OPTIONS: {
  value: CandidateDisposition
  label: string
}[] = [
  { value: "under_review", label: DISPOSITION_LABELS.under_review },
  { value: "shortlisted", label: DISPOSITION_LABELS.shortlisted },
  { value: "rejected", label: DISPOSITION_LABELS.rejected },
  { value: "hired", label: DISPOSITION_LABELS.hired },
]

export const DISPOSITION_FILTER_OPTIONS: {
  value: CandidateDisposition | "all"
  label: string
}[] = [{ value: "all", label: "All dispositions" }, ...DISPOSITION_OPTIONS]
