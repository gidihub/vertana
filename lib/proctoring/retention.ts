import { PROCTORING_RETENTION_DAYS } from "@/lib/proctoring/config"

export function proctoringExpiresAt(from = new Date()): string {
  const expires = new Date(from)
  expires.setDate(expires.getDate() + PROCTORING_RETENTION_DAYS)
  return expires.toISOString()
}
