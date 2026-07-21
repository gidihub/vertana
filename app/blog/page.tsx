import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, Users } from "lucide-react"

import { PageShell } from "@/components/marketing/page-shell"
import { listPublicBlogEntries } from "@/lib/cms/blog-queries"
import { BLOG_EDITORIAL_STANDARDS_PATH, BLOG_TEAM_BYLINE } from "@/lib/marketing/blog-eeat"
import { resolveBlogCoverUrl } from "@/lib/marketing/blog-covers"
import {
  formatBlogDate,
  readingTimeLabel,
  type BlogPost,
} from "@/lib/marketing/blog"
import type { BlogPostRow } from "@/lib/cms/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog · Vertana",
  description:
    "Practical guides on skills assessment, technical hiring, and building a fair, cheat-resistant interview process.",
}

type IndexEntry =
  | { source: "cms"; post: BlogPostRow }
  | { source: "legacy"; post: BlogPost }

export default async function BlogIndexPage() {
  const entries = await listPublicBlogEntries()

  return (
    <PageShell>
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Resources
          </p>
          <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">
            Practical guides on skills assessment, technical hiring, and
            interview integrity — from{" "}
            <Link
              href={BLOG_EDITORIAL_STANDARDS_PATH}
              className="font-medium text-pine hover:underline"
            >
              {BLOG_TEAM_BYLINE}
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          {entries.length === 0 ? (
            <p className="text-sm text-ink-muted">No articles published yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {entries.map((entry) => (
                <li key={entrySlug(entry)}>
                  <PostCard entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border-t border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <p className="text-sm text-ink-muted">
            See our{" "}
            <Link
              href={BLOG_EDITORIAL_STANDARDS_PATH}
              className="font-medium text-pine hover:underline"
            >
              editorial standards
            </Link>{" "}
            for sourcing, updates, and corrections.
          </p>
        </div>
      </section>
    </PageShell>
  )
}

function entrySlug(entry: IndexEntry) {
  return entry.post.slug
}

function PostCard({ entry }: { entry: IndexEntry }) {
  const slug = entrySlug(entry)
  const category = entry.post.category
  const title = entry.post.title
  const excerpt = entry.post.excerpt
  const cover =
    entry.source === "cms"
      ? resolveBlogCoverUrl(entry.post.cover_image_url, category)
      : resolveBlogCoverUrl(null, category)
  const { dateIso, readTime, showUpdated } = entryDates(entry)

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-sage-line/80 bg-card shadow-sm transition-all hover:border-pine/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-pine/10 sm:aspect-auto sm:h-auto sm:w-44 sm:min-h-[140px]">
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, 176px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-pine px-2.5 py-0.5 text-xs font-semibold lowercase text-pine-foreground">
              published
            </span>
            <CategoryChip category={category} />
            {showUpdated ? (
              <span className="inline-flex items-center rounded-full border border-sage-line bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                Updated
              </span>
            ) : null}
          </div>
          <h2 className="font-sans text-xl font-semibold tracking-tight text-balance text-ink group-hover:text-pine">
            {title}
          </h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {excerpt}
          </p>
          <PostMeta dateIso={dateIso} readTime={readTime} />
        </div>
      </div>
    </Link>
  )
}

function entryDates(entry: IndexEntry) {
  if (entry.source === "legacy") {
    const post = entry.post
    return {
      dateIso: post.publishedAt,
      readTime: readingTimeLabel(post),
      showUpdated: post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10),
    }
  }
  const post = entry.post
  const published = (post.published_at ?? post.created_at).slice(0, 10)
  const updated = post.updated_at.slice(0, 10)
  return {
    dateIso: published,
    readTime: post.read_time,
    showUpdated: updated !== published,
  }
}

function PostMeta({
  dateIso,
  readTime,
}: {
  dateIso: string
  readTime: string
}) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="size-3.5 shrink-0" aria-hidden />
        <time dateTime={dateIso}>{formatBlogDate(dateIso)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5 shrink-0" aria-hidden />
        {readTime}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-3.5 shrink-0" aria-hidden />
        <span>
          by{" "}
          <span className="font-medium text-ink">{BLOG_TEAM_BYLINE}</span>
        </span>
      </span>
    </div>
  )
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-sage-line bg-sage px-2.5 py-0.5 text-xs font-semibold text-ink">
      {category}
    </span>
  )
}
