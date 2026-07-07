import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { PageShell } from "@/components/marketing/page-shell"
import {
  BLOG_POSTS,
  formatBlogDate,
  getFeaturedPost,
  type BlogPost,
} from "@/lib/marketing/blog"

export const metadata: Metadata = {
  title: "Blog · Vertana",
  description:
    "Practical guides on skills assessment, technical hiring, and building a fair, cheat-resistant interview process.",
}

export default function BlogIndexPage() {
  const featured = getFeaturedPost()
  const rest = BLOG_POSTS.filter((p) => p.slug !== featured.slug)

  return (
    <PageShell>
      {/* Header */}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Resources
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Guides for building a fair, effective hiring process
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted text-pretty">
            Practical, opinionated writing on skills assessment, technical
            hiring, and interview integrity — from the team building Vertana.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6">
          <Link
            href={`/blog/${featured.slug}`}
            className="group grid overflow-hidden rounded-3xl border border-sage-line bg-card transition-colors hover:border-pine/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper lg:grid-cols-2"
          >
            <div className="flex flex-col justify-center gap-4 p-8 sm:p-12">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pine">
                  Featured
                </span>
                <CategoryChip category={featured.category} />
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-ink">
                {featured.title}
              </h2>
              <p className="text-base leading-relaxed text-ink-muted text-pretty">
                {featured.excerpt}
              </p>
              <PostMeta post={featured} />
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-pine">
                Read the guide
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </div>
            <div className="relative hidden items-center justify-center border-t border-sage-line/70 bg-pine p-12 lg:flex lg:border-l lg:border-t-0">
              <p className="max-w-xs font-display text-2xl font-medium leading-snug text-pine-foreground/90 text-balance">
                &ldquo;{featured.intent}&rdquo;
              </p>
              <span className="absolute bottom-6 left-12 text-xs uppercase tracking-widest text-pine-foreground/50">
                What readers search
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-muted">
            All articles
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-sage-line bg-card p-6 transition-colors hover:border-pine/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <CategoryChip category={post.category} />
      <h3 className="font-display text-xl font-semibold tracking-tight text-balance text-ink">
        {post.title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-ink-muted text-pretty">
        {post.excerpt}
      </p>
      <PostMeta post={post} />
    </Link>
  )
}

function PostMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
      <span className="font-medium text-ink">{post.author}</span>
      <span aria-hidden>·</span>
      <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        {post.readMinutes} min read
      </span>
    </div>
  )
}

function CategoryChip({ category }: { category: BlogPost["category"] }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-sage-line bg-sage px-3 py-1 text-xs font-semibold text-ink">
      {category}
    </span>
  )
}
