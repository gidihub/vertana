import { createAdminClient } from "@/lib/supabase/admin"
import { getCmsUserAnalytics } from "@/lib/cms/users"

export type CmsOverviewStats = {
  totalUsers: number
  newUsersThisMonth: number
  organizations: number
  blogPublished: number
  blogDrafts: number
  feedbackNew: number
}

async function countBlog(status: "published" | "draft"): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", status)
    .is("deleted_at", null)
  if (error) throw error
  return count ?? 0
}

async function countNewFeedback(): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from("cms_feedback")
    .select("*", { count: "exact", head: true })
    .eq("status", "new")
  if (error) throw error
  return count ?? 0
}

export async function getCmsOverviewStats(): Promise<CmsOverviewStats> {
  const [users, blogPublished, blogDrafts, feedbackNew] = await Promise.all([
    getCmsUserAnalytics(),
    countBlog("published"),
    countBlog("draft"),
    countNewFeedback(),
  ])

  return {
    totalUsers: users.totalUsers,
    newUsersThisMonth: users.newThisMonth,
    organizations: users.organizations,
    blogPublished,
    blogDrafts,
    feedbackNew,
  }
}
