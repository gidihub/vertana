import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check, ShieldCheck } from "lucide-react"

import { PageShell } from "@/components/marketing/page-shell"
import {
  ASSESSMENT_LANDINGS,
  getAssessmentLanding,
} from "@/lib/marketing/assessments"

export function generateStaticParams() {
  return ASSESSMENT_LANDINGS.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getAssessmentLanding(slug)
  if (!page) return { title: "Not found · Vertana" }
  return {
    title: `${page.title} · Vertana`,
    description: page.metaDescription,
  }
}

export default async function AssessmentLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = getAssessmentLanding(slug)
  if (!page) notFound()

  const related = ASSESSMENT_LANDINGS.filter((p) => p.slug !== page.slug).slice(
    0,
    3,
  )

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-sage-line/70">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            {page.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-ink sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted text-pretty">
            {page.lead}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep"
            >
              Build this assessment
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage"
            >
              Start free — add library questions
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 className="font-sans text-2xl font-semibold text-ink">
              What this assessment tests
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {page.whatItTests.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-lime-ink">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-sage-line bg-paper p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-pine">
              Sample question
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink text-pretty">
              {page.sampleQuestion}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-sage-line/70 bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex gap-4 rounded-2xl border border-sage-line bg-card p-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pine/10 text-pine">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">
                AI-resistant by design
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
                {page.aiResistance}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-sans text-2xl font-semibold text-ink">
            More hiring assessments
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((other) => (
              <Link
                key={other.slug}
                href={`/assessments/${other.slug}`}
                className="rounded-xl border border-sage-line bg-paper p-5 text-sm font-semibold text-ink transition-colors hover:bg-sage"
              >
                {other.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
