import { PROCTORING_RETENTION_DAYS } from "@/lib/proctoring/config"

/**
 * Expiry timestamp for a piece of proctoring media.
 * @param from  capture time
 * @param days  org-specific retention window; falls back to the global default
 *              when null/undefined.
 */
export function proctoringExpiresAt(
  from = new Date(),
  days?: number | null,
): string {
  const window =
    typeof days === "number" && days > 0 ? days : PROCTORING_RETENTION_DAYS
  const expires = new Date(from)
  expires.setDate(expires.getDate() + window)
  return expires.toISOString()
}
