import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import {
  BlogArticleByline,
  BlogCorrectionNote,
  BlogExperienceNote,
  BlogProductDisclosure,
  BlogRelatedPosts,
  BlogSourcesSection,
} from "@/components/marketing/blog-article-chrome"
import { PageShell } from "@/components/marketing/page-shell"
import {
  formatBlogDate,
  getRelatedPosts,
  readingTimeLabel,
  type BlogBlock,
  type BlogPost,
} from "@/lib/marketing/blog"

function toId(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
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
    default:
      return null
  }
}

export function BlogLegacyArticle({ post }: { post: BlogPost }) {
  const headings = post.blocks.filter((b) => b.type === "heading")
  const related = getRelatedPosts(post.slug)
  const readingTime = readingTimeLabel(post)
  const bodyText = post.blocks
    .map((b) => {
      if (b.type === "bullets") return b.items.join(" ")
      if (b.type === "callout") return `${b.title} ${b.text}`
      return b.text
    })
    .join(" ")

  return (
    <PageShell>
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <Link
            href="/blog"
            className="flex w-fit items-center gap-2 rounded text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-card"
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
            publishedAt={post.publishedAt}
            updatedAt={post.updatedAt}
            readingTime={readingTime}
          />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[220px_1fr] lg:gap-16">
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

          <article className="max-w-2xl">
            {post.experienceNote ? (
              <BlogExperienceNote text={post.experienceNote} />
            ) : null}

            {post.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}

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

            <BlogSourcesSection sources={post.sources} />
            <BlogRelatedPosts
              posts={related.map((r) => ({
                slug: r.slug,
                title: r.title,
                category: r.category,
              }))}
            />
            <BlogProductDisclosure />
            {"correctionNote" in post && post.correctionNote ? (
              <BlogCorrectionNote
                note={post.correctionNote as string}
                correctedAt={post.updatedAt}
              />
            ) : null}
          </article>
        </div>
      </section>
    </PageShell>
  )
}
