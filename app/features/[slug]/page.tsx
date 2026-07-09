import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { PageShell } from "@/components/marketing/page-shell"
import { FEATURES, getFeature } from "@/lib/marketing/content"

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const feature = getFeature(slug)
  if (!feature) return { title: "Not found · Vertana" }
  return {
    title: `${feature.title} · Vertana`,
    description: feature.lead,
  }
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const feature = getFeature(slug)
  if (!feature) notFound()

  const others = FEATURES.filter((f) => f.slug !== feature.slug)

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sage-line/70">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,var(--color-sage-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-sage-line)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            {feature.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-ink sm:text-5xl">
            {feature.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted text-pretty">
            {feature.lead}
          </p>

          <ul className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {feature.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-center gap-2 text-sm text-ink"
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-lime text-lime-ink">
                  <Check className="size-3" aria-hidden />
                </span>
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Create your first test
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/#product"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-line bg-transparent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              See all features
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-6 md:grid-cols-3">
            {feature.highlights.map((h) => (
              <div
                key={h.title}
                className="flex flex-col rounded-2xl border border-sage-line bg-paper p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-pine/10 text-pine">
                  <h.icon className="size-5" stroke={1.75} aria-hidden />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">
                  {h.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {h.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep dive */}
      <section className="border-b border-sage-line/70 bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <h2 className="font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              {feature.detail.heading}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted text-pretty">
              {feature.detail.body}
            </p>
          </div>
          <ul className="flex flex-col gap-4 lg:pt-2">
            {feature.detail.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-xl border border-sage-line bg-card p-4"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-pine text-pine-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <span className="text-sm leading-relaxed text-ink">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Checklist strip */}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {feature.checklist.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-ink">
                <span className="flex size-5 items-center justify-center rounded-full bg-lime text-lime-ink">
                  <Check className="size-3" aria-hidden />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore more */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-ink">
            Explore more of the product
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/features/${o.slug}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-sage-line bg-card p-5 transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <span className="text-sm font-semibold text-ink">
                  {o.title}
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
