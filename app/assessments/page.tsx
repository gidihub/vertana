import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PageShell } from "@/components/marketing/page-shell"
import { ASSESSMENT_LANDINGS } from "@/lib/marketing/assessments"

export const metadata: Metadata = {
  title: "Hiring assessments by role · Vertana",
  description:
    "Browse recruiter-intent assessment guides for engineering, data, AI, and business roles — with AI-resistant question strategies.",
}

export default function AssessmentsIndexPage() {
  return (
    <PageShell>
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Assessments
          </p>
          <h1 className="mt-3 max-w-3xl font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Role-specific hiring assessments
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted text-pretty">
            Indexable guides for recruiter search intent — what to test, sample
            questions, and how Vertana keeps assessments AI-resistant.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {ASSESSMENT_LANDINGS.map((page) => (
            <Link
              key={page.slug}
              href={`/assessments/${page.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-sage-line bg-card p-6 transition-colors hover:border-pine/40 hover:bg-sage/30"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-pine">
                {page.eyebrow}
              </p>
              <h2 className="text-lg font-semibold leading-snug text-ink">
                {page.title}
              </h2>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
                View guide
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
