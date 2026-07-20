import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PageShell } from "@/components/marketing/page-shell"
import { listPublicBlogEntries } from "@/lib/cms/blog-queries"
import {
  BLOG_POSTS,
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
  const featured = entries[0]
  const rest = entries.slice(1)

  return (
    <PageShell>
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Resources
          </p>
          <h1 className="mt-3 max-w-2xl font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Guides for building a fair, effective hiring process
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted text-pretty">
            Practical, opinionated writing on skills assessment, technical
            hiring, and interview integrity — from the team building Vertana.
          </p>
        </div>
      </section>

      {featured ? (
        <section className="bg-paper">
          <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6">
            <FeaturedCard entry={featured} />
          </div>
        </section>
      ) : null}

      <section className="bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-muted">
            All articles
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((entry) => (
              <PostCard key={entrySlug(entry)} entry={entry} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-sm text-ink-muted">
            Articles are published by{" "}
            <Link href="/blog/editorial-standards" className="font-medium text-pine hover:underline">
              The Vertana Team
            </Link>
            . See our editorial standards for sourcing and updates.
          </p>
        </div>
      </section>
    </PageShell>
  )
}

function entrySlug(entry: IndexEntry) {
  return entry.post.slug
}

async function FeaturedCard({ entry }: { entry: IndexEntry }) {
  const slug = entrySlug(entry)
  const title = entry.post.title
  const excerpt = entry.post.excerpt
  const category = entry.post.category
  const intent =
    entry.source === "legacy" ? entry.post.intent : excerpt.slice(0, 120)

  return (
    <Link
      href={`/blog/${slug}`}
      className="group grid overflow-hidden rounded-3xl border border-sage-line bg-card transition-colors hover:border-pine/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper lg:grid-cols-2"
    >
      <div className="flex flex-col justify-center gap-4 p-8 sm:p-12">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pine">
            Featured
          </span>
          <CategoryChip category={category} />
        </div>
        <h2 className="font-sans text-3xl font-semibold tracking-tight text-balance text-ink">
          {title}
        </h2>
        <p className="text-base leading-relaxed text-ink-muted text-pretty">
          {excerpt}
        </p>
        <PostMeta entry={entry} />
        <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-pine">
          Read the guide
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
      <div className="relative hidden items-center justify-center border-t border-sage-line/70 bg-pine p-12 lg:flex lg:border-l lg:border-t-0">
        <p className="max-w-xs font-sans text-2xl font-medium leading-snug text-pine-foreground/90 text-balance">
          &ldquo;{intent}&rdquo;
        </p>
        <span className="absolute bottom-6 left-12 text-xs uppercase tracking-widest text-pine-foreground/50">
          What readers search
        </span>
      </div>
    </Link>
  )
}

function PostCard({ entry }: { entry: IndexEntry }) {
  const slug = entrySlug(entry)
  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-sage-line bg-card p-6 transition-colors hover:border-pine/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <CategoryChip category={entry.post.category} />
      <h3 className="font-sans text-xl font-semibold tracking-tight text-balance text-ink">
        {entry.post.title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-ink-muted text-pretty">
        {entry.post.excerpt}
      </p>
      <PostMeta entry={entry} />
    </Link>
  )
}

async function PostMeta({ entry }: { entry: IndexEntry }) {
  if (entry.source === "legacy") {
    const post = entry.post
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span className="font-medium text-ink">The Vertana Team</span>
        <span aria-hidden>·</span>
        <time dateTime={post.publishedAt}>
          {formatBlogDate(post.publishedAt)}
        </time>
        <span aria-hidden>·</span>
        <span>{readingTimeLabel(post)}</span>
      </div>
    )
  }

  const post = entry.post
  const dateIso = (post.published_at ?? post.created_at).slice(0, 10)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
      <span className="font-medium text-ink">The Vertana Team</span>
      <span aria-hidden>·</span>
      <time dateTime={dateIso}>{formatBlogDate(dateIso)}</time>
      <span aria-hidden>·</span>
      <span>{post.read_time}</span>
    </div>
  )
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-sage-line bg-sage px-3 py-1 text-xs font-semibold text-ink">
      {category}
    </span>
  )
}
