import { createAdminClient } from "@/lib/supabase/admin"

/** Publish draft posts whose scheduled_at is in the past. Returns count published. */
export async function publishDueScheduledPosts(): Promise<number> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from("blog_posts")
    .select("id, scheduled_at")
    .eq("status", "draft")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .is("deleted_at", null)

  if (error) {
    console.error("[vertana] publishDueScheduledPosts query failed:", error.message)
    return 0
  }
  if (!data?.length) return 0

  let published = 0
  for (const row of data) {
    const { error: updateError } = await admin
      .from("blog_posts")
      .update({
        status: "published",
        published_at: row.scheduled_at ?? now,
        scheduled_at: null,
      })
      .eq("id", row.id)
    if (!updateError) published += 1
  }
  return published
}
