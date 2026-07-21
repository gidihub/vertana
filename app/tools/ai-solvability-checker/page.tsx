import type { Metadata } from "next"

import {
  AiSolvabilityChecker,
  PrivacyNote,
} from "@/components/marketing/ai-solvability-checker"
import { PageShell } from "@/components/marketing/page-shell"
import { getLibraryStats } from "@/lib/marketing/blog-stats"

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertana.io"
).replace(/\/$/, "")

const PAGE_PATH = "/tools/ai-solvability-checker"
const OG_IMAGE = `${SITE_URL}/tools/ai-solvability-checker-og.svg`

export const metadata: Metadata = {
  title: "AI solvability checker — is your interview question AI-proof? · Vertana",
  description:
    "Paste an interview or assessment question. See how easily an LLM solves it, read the model's actual answer, and get concrete rewrites to increase AI resistance. Free, no login.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: "AI solvability checker",
    description:
      "Free tool: paste a hiring question, see the model's attempt, and learn how to make it AI-resistant.",
    url: PAGE_PATH,
    type: "website",
    images: [{ url: OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI solvability checker · Vertana",
    description:
      "Paste a hiring question. See if an LLM solves it — and how to fix it.",
    images: [OG_IMAGE],
  },
}

export default function AiSolvabilityCheckerPage() {
  const stats = getLibraryStats()
  const highPct = Math.round(
    (stats.aiResistance.high / stats.generatedQuestionCount) * 100,
  )

  return (
    <PageShell>
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            Free tool
          </p>
          <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            AI solvability checker
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted text-pretty">
            Paste an interview or assessment question. We run a cold model attempt,
            show you exactly what it produced, and tell you how to make the prompt
            resist generic AI answers.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <AiSolvabilityChecker
            libraryHighResistancePct={highPct}
            libraryQuestionCount={stats.generatedQuestionCount}
          />
        </div>
      </section>

      <ExplainerSection />
    </PageShell>
  )
}

function ExplainerSection() {
  return (
    <section className="border-t border-sage-line/70 bg-card">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          What AI-solvability means
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted">
          <p>
            AI-solvability is how completely a modern chatbot can answer your
            question when given only the prompt — no live company context, no
            proprietary codebase, no confidential metrics. If the model produces a
            strong answer cold, candidates can too.
          </p>
          <p>
            Resistance is not obscurity. A niche trivia fact may stump humans and
            still be trivial for a model. Resistant questions bind to artifacts you
            supply — logs, diffs, partial code, ambiguous metrics — so a generic
            essay scores poorly on your rubric.
          </p>
        </div>

        <h3 className="mt-12 text-xl font-semibold text-ink">How the check works</h3>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed text-ink-muted">
          <li>
            We send your question to a model as untrusted data — never as
            instructions — and capture its good-faith answer.
          </li>
          <li>
            A second pass compares the attempt to your prompt using the same{" "}
            <strong className="font-medium text-ink">ai_resistance</strong> rubric
            we use when tagging Vertana&apos;s question library.
          </li>
          <li>
            You see the verdict in plain language, the model&apos;s actual output,
            specific reasons, and rewrites you can copy.
          </li>
        </ol>

        <h3 className="mt-12 text-xl font-semibold text-ink">Why it matters</h3>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Hiring teams still paste take-homes that ChatGPT completes in one shot.
          Seeing the model&apos;s answer on your own question makes the risk concrete
          — and points to fixes that don&apos;t rely on surveillance alone.
        </p>

        <div className="mt-10">
          <PrivacyNote />
        </div>
      </div>
    </section>
  )
}
