import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check } from "lucide-react"
import { PageShell } from "@/components/marketing/page-shell"
import { LEGAL_DOCS, getLegalDoc } from "@/lib/marketing/legal"

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const doc = getLegalDoc(slug)
  if (!doc) return { title: "Not found · Vertana" }
  return { title: `${doc.title} · Vertana`, description: doc.summary }
}

function toId(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const doc = getLegalDoc(slug)
  if (!doc) notFound()

  return (
    <PageShell>
      {/* Header */}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Legal
          </p>
          <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            {doc.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">
            {doc.summary}
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            Last updated {doc.updated}
          </p>
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
              {doc.sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${toId(section.heading)}`}
                    className="rounded text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sections */}
          <div className="max-w-2xl">
            {doc.sections.map((section) => (
              <div
                key={section.heading}
                id={toId(section.heading)}
                className="scroll-mt-24 border-b border-sage-line/70 pb-8 pt-8 first:pt-0 last:border-b-0"
              >
                <h2 className="font-sans text-2xl font-semibold tracking-tight text-ink">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="mt-4 text-base leading-relaxed text-ink-muted text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-4 flex flex-col gap-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine">
                          <Check className="size-3" aria-hidden />
                        </span>
                        <span className="text-base leading-relaxed text-ink-muted">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            {/* Cross-links */}
            <div className="mt-10 flex flex-wrap gap-3">
              {LEGAL_DOCS.filter((d) => d.slug !== doc.slug).map((d) => (
                <Link
                  key={d.slug}
                  href={`/legal/${d.slug}`}
                  className="rounded-full border border-sage-line bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  {d.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
