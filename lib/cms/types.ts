export type BlogPostStatus = "draft" | "published"

export type BlogSourceRow = {
  title: string
  url: string
  publisher: string
  year: number
}

export type BlogPostRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  author: string
  cover_image_url: string | null
  status: BlogPostStatus
  read_time: string
  tags: string[]
  sources: BlogSourceRow[]
  correction_note: string | null
  scheduled_at: string | null
  published_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type BlogAuthorRow = {
  slug: string
  name: string
  title: string
  bio: string
  avatar_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export type CmsFeedbackRow = {
  id: string
  source: string
  message: string
  email: string | null
  page_url: string | null
  status: "new" | "reviewed" | "archived"
  created_at: string
  updated_at: string
}

export type CmsAnnouncementRow = {
  id: string
  title: string
  body: string
  link_url: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export const BLOG_PATCH_ALLOWLIST = [
  "slug",
  "title",
  "excerpt",
  "content",
  "category",
  "author",
  "cover_image_url",
  "status",
  "read_time",
  "tags",
  "sources",
  "correction_note",
  "scheduled_at",
  "published_at",
] as const

export function estimateReadTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  const words = text ? text.split(" ").length : 0
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} min read`
}

export function estimateReadTimeFromText(text: string): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} min read`
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function isHttpsUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true
  try {
    const u = new URL(url)
    return u.protocol === "https:"
  } catch {
    return false
  }
}
