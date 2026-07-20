import { isHttpsUrl } from "@/lib/cms/types"
import type { CmsAnnouncementRow } from "@/lib/cms/types"

/** Relative in-app paths or HTTPS URLs for announcement CTAs. */
export function isValidAnnouncementLink(url: string | null | undefined): boolean {
  if (!url?.trim()) return true
  const trimmed = url.trim()
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true
  return isHttpsUrl(trimmed)
}

export function normalizeAnnouncementLink(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null
  return url.trim()
}

export function announcementMessage(row: CmsAnnouncementRow): string {
  return row.body.trim() || row.title.trim()
}
