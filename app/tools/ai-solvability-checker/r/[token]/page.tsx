import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { SolvabilityResultPanel } from "@/components/marketing/ai-solvability-result"
import { PageShell } from "@/components/marketing/page-shell"
import { getLibraryStats } from "@/lib/marketing/blog-stats"
import { findSharedCheck } from "@/lib/tools/ai-solvability"

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertana.io"
).replace(/\/$/, "")

const OG_IMAGE = `${SITE_URL}/tools/ai-solvability-checker-og.svg`

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const result = await findSharedCheck(token)
  if (!result) {
    return { title: "Shared result not found · Vertana" }
  }

  const path = `/tools/ai-solvability-checker/r/${token}`
  return {
    title: `${result.verdictLabel} — AI solvability result · Vertana`,
    description: `Shared AI-solvability check: ${result.verdictLabel}. See what the model produced and how to increase resistance.`,
    alternates: { canonical: path },
    openGraph: {
      title: `AI solvability: ${result.verdictLabel}`,
      description: result.properties[0] ?? "Shared AI-solvability check result.",
      url: path,
      type: "article",
      images: [{ url: OG_IMAGE }],
    },
  }
}

export default async function SharedSolvabilityResultPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await findSharedCheck(token)
  if (!result) notFound()

  const stats = getLibraryStats()
  const highPct = Math.round(
    (stats.aiResistance.high / stats.generatedQuestionCount) * 100,
  )

  return (
    <PageShell>
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Shared result
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            AI solvability check
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Question text isn&apos;t stored — only this analysis is shared.{" "}
            <Link href="/tools/ai-solvability-checker" className="font-medium text-pine hover:underline">
              Run your own check
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <SolvabilityResultPanel
            result={result}
            libraryHighResistancePct={highPct}
          />
        </div>
      </section>
    </PageShell>
  )
}
