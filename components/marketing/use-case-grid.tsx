import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { USE_CASES } from "@/lib/marketing/content"

export function UseCaseGrid() {
  return (
    <section className="border-b border-sage-line/70 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Use cases
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Built for how you actually hire
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((useCase) => (
            <Link
              key={useCase.slug}
              href={`/use-cases/${useCase.slug}`}
              className="group flex flex-col rounded-2xl border border-sage-line bg-card p-6 transition-colors hover:border-pine/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <h3 className="text-lg font-semibold text-ink">
                {useCase.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                {useCase.lead}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
                Learn more
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
  )
}
