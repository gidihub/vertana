import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { PageShell } from "@/components/marketing/page-shell"
import { USE_CASES, getUseCase } from "@/lib/marketing/content"

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const useCase = getUseCase(slug)
  if (!useCase) return { title: "Not found · Vertana" }
  return {
    title: `${useCase.title} · Vertana`,
    description: useCase.lead,
  }
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const useCase = getUseCase(slug)
  if (!useCase) notFound()

  const others = USE_CASES.filter((u) => u.slug !== useCase.slug)

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
            {useCase.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-ink sm:text-5xl">
            {useCase.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted text-pretty">
            {useCase.lead}
          </p>

          <ul className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {useCase.bullets.map((bullet) => (
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
              href="/#how"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-line bg-transparent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Outcomes strip */}
      <section className="border-b border-sage-line/70 bg-pine text-pine-foreground">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {useCase.outcomes.map((o) => (
            <div key={o.label} className="flex flex-col gap-1">
              <span className="font-sans text-3xl font-semibold tracking-tight">
                {o.stat}
              </span>
              <span className="text-sm leading-relaxed text-pine-foreground/75">
                {o.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* The problem */}
      <section className="border-b border-sage-line/70 bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-pine">
              The problem
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              Why the old way falls short
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {useCase.pains.map((pain) => (
              <div
                key={pain.title}
                className="rounded-2xl border border-sage-line bg-card p-6"
              >
                <h3 className="text-lg font-semibold text-ink">{pain.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {pain.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Vertana helps */}
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-pine">
              How Vertana helps
            </p>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              A screen your whole team can trust
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {useCase.solutions.map((s) => (
              <div
                key={s.title}
                className="flex flex-col rounded-2xl border border-sage-line bg-paper p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-pine/10 text-pine">
                  <s.icon className="size-5" stroke={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore more */}
      <section className="bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-ink">
            More ways teams use Vertana
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/use-cases/${o.slug}`}
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
