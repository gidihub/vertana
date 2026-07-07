export function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  short_answer: "Short Answer",
  coding: "Coding",
}

export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  invited: "Invited",
  in_progress: "In progress",
  submitted: "Submitted",
  expired: "Expired",
}
