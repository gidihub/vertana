import type { CmsAnnouncementRow } from "@/lib/cms/types"
import { createAdminClient } from "@/lib/supabase/admin"

/** The live site banner — at most one published announcement. */
export async function getActiveAnnouncement(): Promise<CmsAnnouncementRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("cms_announcements")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as CmsAnnouncementRow | null
}
