import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { PageShell } from "@/components/marketing/page-shell"
import { COMPARISONS, getComparison } from "@/lib/marketing/compare"

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const cmp = getComparison(slug)
  if (!cmp) return { title: "Not found · Vertana" }
  const title = `Vertana vs ${cmp.competitor}`
  const description = `An honest, sourced comparison of Vertana and ${cmp.competitor} — pricing, seats, AI-cheating approach, and features. Verified 2026.`
  return {
    title: `${title} · Vertana`,
    description,
    alternates: { canonical: `/compare/${cmp.slug}` },
    openGraph: {
      title,
      description,
      url: `/compare/${cmp.slug}`,
      type: "article",
    },
  }
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cmp = getComparison(slug)
  if (!cmp) notFound()

  return (
    <PageShell>
      {/* Header */}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Comparison
          </p>
          <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Vertana vs {cmp.competitor}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted text-pretty">
            {cmp.intro}
          </p>
          {cmp.note ? (
            <p className="mt-5 max-w-2xl rounded-xl border border-sage-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink">
              {cmp.note}
            </p>
          ) : null}
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-b border-sage-line/70 bg-paper">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-sage-line">
                  <th className="py-3 pr-4 text-left font-semibold text-ink" />
                  <th className="px-4 py-3 text-left font-semibold text-pine">
                    Vertana
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-ink">
                    {cmp.competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {cmp.rows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-sage-line/60 align-top"
                  >
                    <th
                      scope="row"
                      className="py-4 pr-4 text-left text-sm font-medium text-ink"
                    >
                      {row.feature}
                    </th>
                    <td className="px-4 py-4 font-medium text-ink">
                      {row.vertana}
                    </td>
                    <td className="px-4 py-4 text-ink-muted">
                      {row.competitor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-ink-muted">
            {cmp.competitor} figures sourced from {cmp.sourceDomain} and public
            review aggregators, verified 2026. Vendors change pricing and
            features often — check the source before relying on any single row.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-pine">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-pine-foreground sm:text-4xl">
            See the difference on your next role
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-pine-foreground/80">
            Test your first 10 candidates free — no credit card, no trial clock,
            unlimited seats.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-lime-ink transition-colors hover:bg-lime/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
            >
              Sign up free
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-pine-foreground/30 px-6 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
