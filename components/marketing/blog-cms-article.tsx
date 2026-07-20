import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { CmsArticleBody } from "@/components/cms/blog-article-body"
import {
  BlogArticleByline,
  BlogCorrectionNote,
  BlogProductDisclosure,
  BlogRelatedPosts,
  BlogSourcesSection,
} from "@/components/marketing/blog-article-chrome"
import { PageShell } from "@/components/marketing/page-shell"
import { getRelatedPosts } from "@/lib/marketing/blog"
import type { BlogPostRow, BlogSourceRow } from "@/lib/cms/types"

export function BlogCmsArticle({
  post,
  preview,
}: {
  post: BlogPostRow
  preview?: boolean
}) {
  const publishedAt = post.published_at ?? post.created_at
  const related = getRelatedPosts(post.slug).map((r) => ({
    slug: r.slug,
    title: r.title,
    category: r.category,
  }))
  const sources = (post.sources ?? []) as BlogSourceRow[]
  const showSourcesSection = sources.length > 0 && !post.content.includes("<h2>Sources</h2>")

  return (
    <PageShell>
      {preview ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Draft preview — visible to staff only
        </div>
      ) : null}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <Link
            href="/blog"
            className="flex w-fit items-center gap-2 rounded text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All articles
          </Link>
          <span className="mt-6 flex w-fit items-center rounded-full border border-sage-line bg-sage px-3 py-1 text-xs font-semibold text-ink">
            {post.category}
          </span>
          <h1 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">
            {post.excerpt}
          </p>
          <BlogArticleByline
            publishedAt={publishedAt}
            updatedAt={post.updated_at}
            readingTime={post.read_time}
          />
        </div>
      </section>
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt=""
              className="mb-10 w-full rounded-2xl border border-sage-line object-cover"
            />
          ) : null}
          <article>
            <CmsArticleBody html={post.content} />
            {showSourcesSection ? (
              <BlogSourcesSection sources={sources} />
            ) : null}
            <BlogRelatedPosts posts={related} />
            <BlogProductDisclosure />
            {post.correction_note ? (
              <BlogCorrectionNote
                note={post.correction_note}
                correctedAt={post.updated_at}
              />
            ) : null}
          </article>
        </div>
      </section>
    </PageShell>
  )
}
