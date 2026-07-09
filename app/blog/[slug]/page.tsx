import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Clock, Quote } from "lucide-react"
import { PageShell } from "@/components/marketing/page-shell"
import {
  BLOG_POSTS,
  formatBlogDate,
  getBlogPost,
  getRelatedPosts,
  type BlogBlock,
} from "@/lib/marketing/blog"

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: "Not found · Vertana" }
  return { title: `${post.title} · Vertana`, description: post.excerpt }
}

function toId(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const headings = post.blocks.filter((b) => b.type === "heading") as Extract<
    BlogBlock,
    { type: "heading" }
  >[]
  const related = getRelatedPosts(post.slug)

  return (
    <PageShell>
      {/* Header */}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All articles
          </Link>
          <span className="mt-6 inline-flex w-fit items-center rounded-full border border-sage-line bg-sage px-3 py-1 text-xs font-semibold text-ink">
            {post.category}
          </span>
          <h1 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">
            {post.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
            <span className="font-medium text-ink">{post.author}</span>
            <span className="text-ink-muted">{post.role}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {post.readMinutes} min read
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[220px_1fr] lg:gap-16">
          {/* Table of contents */}
          <nav
            aria-label="On this page"
            className="hidden lg:block lg:sticky lg:top-24 lg:self-start"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
              On this page
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {headings.map((h) => (
                <li key={h.text}>
                  <a
                    href={`#${toId(h.text)}`}
                    className="rounded text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Article */}
          <article className="max-w-2xl">
            {post.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}

            {/* Related product links */}
            <div className="mt-12 rounded-2xl border border-sage-line bg-card p-6">
              <p className="text-sm font-semibold text-ink">
                Put this into practice
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {post.related.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sage-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    {link.label}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 ? (
        <section className="border-t border-sage-line/70 bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-ink">
              Keep reading
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-sage-line bg-paper p-6 transition-colors hover:border-pine/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  <span className="inline-flex w-fit items-center rounded-full border border-sage-line bg-sage px-3 py-1 text-xs font-semibold text-ink">
                    {r.category}
                  </span>
                  <h3 className="font-sans text-lg font-semibold tracking-tight text-balance text-ink">
                    {r.title}
                  </h3>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-pine">
                    Read
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2
          id={toId(block.text)}
          className="scroll-mt-24 pt-10 font-sans text-2xl font-semibold tracking-tight text-ink first:pt-0"
        >
          {block.text}
        </h2>
      )
    case "paragraph":
      return (
        <p className="mt-4 text-base leading-relaxed text-ink-muted text-pretty">
          {block.text}
        </p>
      )
    case "bullets":
      return (
        <ul className="mt-4 flex flex-col gap-3">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-pine" />
              <span className="text-base leading-relaxed text-ink-muted">
                {item}
              </span>
            </li>
          ))}
        </ul>
      )
    case "callout":
      return (
        <div className="mt-6 rounded-2xl border border-lime/40 bg-lime/10 p-5">
          <p className="text-sm font-semibold text-ink">{block.title}</p>
          <p className="mt-1 text-base leading-relaxed text-ink-muted text-pretty">
            {block.text}
          </p>
        </div>
      )
    case "quote":
      return (
        <blockquote className="mt-8 border-l-2 border-pine pl-5">
          <Quote className="size-5 text-pine" aria-hidden />
          <p className="mt-2 font-sans text-xl font-medium leading-snug text-ink text-balance">
            {block.text}
          </p>
          {block.cite ? (
            <cite className="mt-2 block text-sm not-italic text-ink-muted">
              — {block.cite}
            </cite>
          ) : null}
        </blockquote>
      )
    default:
      return null
  }
}
