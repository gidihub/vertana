import {
  BLOG_POSTS,
  countWordsInPost,
  type BlogBlock,
  type BlogPost,
} from "@/lib/marketing/blog"
import { BLOG_TEAM_BYLINE } from "@/lib/marketing/blog-eeat"
import { createAdminClient } from "@/lib/supabase/admin"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function legacyBlocksToHtml(blocks: BlogBlock[]): string {
  const parts: string[] = []

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        parts.push(`<p>${escapeHtml(block.text)}</p>`)
        break
      case "heading":
        parts.push(`<h2>${escapeHtml(block.text)}</h2>`)
        break
      case "bullets":
        parts.push(
          `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        )
        break
      case "callout":
        parts.push(
          `<blockquote><p><strong>${escapeHtml(block.title)}</strong></p><p>${escapeHtml(block.text)}</p></blockquote>`,
        )
        break
      default:
        break
    }
  }

  return parts.join("\n")
}

function relatedLinksHtml(related: Array<{ label: string; href: string }>): string {
  if (!related.length) return ""
  const items = related
    .map(
      (link) =>
        `<li><a href="${escapeHtml(link.href)}" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>`,
    )
    .join("")
  return `<h2>Put this into practice</h2><ul>${items}</ul>`
}

function sourcesHtml(sources: BlogPost["sources"]): string {
  if (!sources.length) return ""
  const items = sources
    .map(
      (s) =>
        `<li><a href="${escapeHtml(s.url)}" rel="noopener noreferrer">${escapeHtml(s.title)}</a> — ${escapeHtml(s.publisher)}, ${s.year}</li>`,
    )
    .join("")
  return `<h2>Sources</h2><ol>${items}</ol>`
}

function experienceNoteHtml(note?: string): string {
  if (!note) return ""
  return `<blockquote><p><strong>What we&apos;ve seen.</strong> ${escapeHtml(note)}</p></blockquote>`
}

export type LegacyBlogImportResult = {
  imported: number
  updated: number
  skipped: number
  slugs: string[]
}

/** Insert missing posts or refresh existing rows from lib/marketing/blog-posts. */
export async function syncLegacyBlogPosts(): Promise<LegacyBlogImportResult> {
  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin
    .from("blog_posts")
    .select("slug, id, deleted_at")

  if (existingError) throw existingError

  const bySlug = new Map(
    (existing ?? []).map((row) => [row.slug, { id: row.id, deleted_at: row.deleted_at }]),
  )
  let imported = 0
  let updated = 0
  let skipped = 0
  const slugs: string[] = []

  for (const post of BLOG_POSTS) {
    const content =
      experienceNoteHtml(post.experienceNote) +
      legacyBlocksToHtml(post.blocks) +
      relatedLinksHtml(post.related) +
      sourcesHtml(post.sources)
    const words = countWordsInPost(post)
    const readTime = `${Math.max(1, Math.round(words / 200))} min read`
    const row: Record<string, unknown> = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content,
      category: post.category,
      author: "vertana-team",
      cover_image_url: null,
      status: "published",
      read_time: readTime,
      tags: [post.category.toLowerCase().replace(/\s+/g, "-")],
      published_at: `${post.publishedAt}T12:00:00.000Z`,
      updated_at: `${post.updatedAt}T12:00:00.000Z`,
    }

    const existingRow = bySlug.get(post.slug)
    if (existingRow) {
      if (existingRow.deleted_at) {
        skipped += 1
        continue
      }
      let { error } = await admin
        .from("blog_posts")
        .update(row)
        .eq("id", existingRow.id)
      if (error?.message?.includes("sources")) {
        const { sources: _s, correction_note: _c, ...rest } = row as {
          sources?: unknown
          correction_note?: unknown
        }
        ;({ error } = await admin
          .from("blog_posts")
          .update(rest)
          .eq("id", existingRow.id))
      }
      if (error) throw error
      updated += 1
      slugs.push(post.slug)
    } else {
      const { error } = await admin.from("blog_posts").insert(row)
      if (error) throw error
      imported += 1
      slugs.push(post.slug)
    }
  }

  return { imported, updated, skipped, slugs }
}

export async function importLegacyBlogPosts(): Promise<LegacyBlogImportResult> {
  return syncLegacyBlogPosts()
}

export function legacyBlogImportSummary() {
  return {
    total: BLOG_POSTS.length,
    author: BLOG_TEAM_BYLINE,
    slugs: BLOG_POSTS.map((p) => p.slug),
  }
}
