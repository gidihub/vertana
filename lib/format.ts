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

/** e.g. "just now", "3 min ago", "2 hr ago" */
export function formatRelativeTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return "—"
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (sec < 60) return "just now"
  if (sec < 3600) {
    const min = Math.floor(sec / 60)
    return `${min} min ago`
  }
  if (sec < 86400) {
    const hr = Math.floor(sec / 3600)
    return `${hr} hr ago`
  }
  return formatDateTime(date.toISOString())
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
