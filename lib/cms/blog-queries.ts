import {
  BLOG_POSTS,
  getBlogPost as getLegacyPost,
  type BlogPost as LegacyBlogPost,
} from "@/lib/marketing/blog"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { BlogAuthorRow, BlogPostRow } from "@/lib/cms/types"

const FALLBACK_AUTHORS: Record<string, BlogAuthorRow> = {
  "vertana-team": {
    slug: "vertana-team",
    name: "The Vertana Team",
    title: "Product & hiring",
    bio: "Updates from the team building Vertana.",
    avatar_url: null,
    twitter_url: null,
    linkedin_url: null,
    published: true,
    created_at: "",
    updated_at: "",
  },
}

export async function cmsRowExistsForSlug(slug: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()
  return Boolean(data)
}

export async function getPublishedPosts(): Promise<BlogPostRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as BlogPostRow[]
}

export async function getPublicPostBySlug(
  slug: string,
): Promise<BlogPostRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle()
  if (error) throw error
  return (data as BlogPostRow | null) ?? null
}

export async function getStaffPreviewPost(
  slug: string,
): Promise<BlogPostRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle()
  if (error) throw error
  return (data as BlogPostRow | null) ?? null
}

export async function getAuthorBySlug(
  slug: string,
): Promise<BlogAuthorRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_authors")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle()
  if (data) return data as BlogAuthorRow
  return FALLBACK_AUTHORS[slug] ?? null
}

export function getLegacyPostOrNull(slug: string): LegacyBlogPost | null {
  return getLegacyPost(slug) ?? null
}

/** Merge CMS posts with legacy posts that have no CMS row for the same slug. */
export async function listPublicBlogEntries(): Promise<
  Array<
    | { source: "cms"; post: BlogPostRow }
    | { source: "legacy"; post: LegacyBlogPost }
  >
> {
  const cms = await getPublishedPosts()
  const cmsSlugs = new Set(cms.map((p) => p.slug))
  const legacy = BLOG_POSTS.filter((p) => !cmsSlugs.has(p.slug)).map(
    (post) => ({ source: "legacy" as const, post }),
  )
  const cmsEntries = cms.map((post) => ({ source: "cms" as const, post }))
  return [...cmsEntries, ...legacy].sort((a, b) => {
    const da =
      a.source === "cms"
        ? a.post.published_at ?? a.post.created_at
        : a.post.publishedAt
    const db =
      b.source === "cms"
        ? b.post.published_at ?? b.post.created_at
        : b.post.publishedAt
    return new Date(db).getTime() - new Date(da).getTime()
  })
}
