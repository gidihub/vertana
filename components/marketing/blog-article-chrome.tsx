import Link from "next/link"
import { Clock } from "lucide-react"

import {
  BLOG_EDITORIAL_STANDARDS_PATH,
  BLOG_PRODUCT_DISCLOSURE,
  BLOG_TEAM_BYLINE,
  BLOG_TEAM_DESCRIPTION,
  type BlogSource,
} from "@/lib/marketing/blog-eeat"
import { formatBlogDate } from "@/lib/marketing/blog"
import { estimateReadTimeFromText } from "@/lib/cms/types"

export type BlogArticleChromeProps = {
  category: string
  title: string
  excerpt: string
  publishedAt: string
  updatedAt: string
  bodyText: string
  sources: BlogSource[]
  experienceNote?: string
  correctionNote?: string
  showProductMention?: boolean
  relatedLinks?: Array<{ label: string; href: string }>
  relatedPosts?: Array<{ slug: string; title: string; category: string }>
  children: React.ReactNode
}

export function BlogArticleByline({
  publishedAt,
  updatedAt,
  readingTime,
}: {
  publishedAt: string
  updatedAt: string
  readingTime: string
}) {
  const showUpdated =
    updatedAt.slice(0, 10) !== publishedAt.slice(0, 10)

  return (
    <div className="mt-6 space-y-3 border-t border-sage-line/70 pt-6">
      <div>
        <p className="text-sm font-medium text-ink">
          <Link
            href={BLOG_EDITORIAL_STANDARDS_PATH}
            className="text-pine hover:underline"
          >
            {BLOG_TEAM_BYLINE}
          </Link>
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
          {BLOG_TEAM_DESCRIPTION}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        <time dateTime={publishedAt.slice(0, 10)}>
          Published {formatBlogDate(publishedAt.slice(0, 10))}
        </time>
        {showUpdated ? (
          <>
            <span aria-hidden>·</span>
            <time dateTime={updatedAt.slice(0, 10)}>
              Updated {formatBlogDate(updatedAt.slice(0, 10))}
            </time>
          </>
        ) : null}
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {readingTime}
        </span>
      </div>
    </div>
  )
}

export function BlogExperienceNote({ text }: { text: string }) {
  return (
    <aside className="my-8 rounded-2xl border border-pine/20 bg-pine/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-pine">
        What we&apos;ve seen
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
    </aside>
  )
}

export function BlogSourcesSection({ sources }: { sources: BlogSource[] }) {
  if (!sources.length) return null
  return (
    <section className="mt-12 border-t border-sage-line/70 pt-8">
      <h2 className="font-sans text-xl font-semibold tracking-tight text-ink">
        Sources
      </h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-muted">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-pine hover:underline"
            >
              {source.title}
            </a>
            <span className="text-ink-muted">
              {" "}
              — {source.publisher}, {source.year}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function BlogCorrectionNote({
  note,
  correctedAt,
}: {
  note: string
  correctedAt: string
}) {
  return (
    <p className="mt-6 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <strong>
        Correction ({formatBlogDate(correctedAt.slice(0, 10))}):
      </strong>{" "}
      {note}
    </p>
  )
}

export function BlogProductDisclosure() {
  return (
    <p className="mt-8 text-xs leading-relaxed text-ink-muted">
      {BLOG_PRODUCT_DISCLOSURE}
    </p>
  )
}

export function BlogRelatedPosts({
  posts,
}: {
  posts: Array<{ slug: string; title: string; category: string }>
}) {
  if (!posts.length) return null
  return (
    <section className="mt-12 border-t border-sage-line/70 pt-8">
      <h2 className="font-sans text-xl font-semibold tracking-tight text-ink">
        Related reading
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-1 rounded-lg border border-sage-line/70 bg-card px-4 py-3 transition-colors hover:border-pine/40"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {post.category}
              </span>
              <span className="font-medium text-ink group-hover:text-pine">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function blogReadingTimeFromBody(bodyText: string): string {
  return estimateReadTimeFromText(bodyText)
}
