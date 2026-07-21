import Link from "next/link"
import { ArrowRight, Check, Copy } from "lucide-react"

import { AiResistanceBadge } from "@/components/builder/ai-resistance-badge"
import { Button } from "@/components/ui/button"
import type { SolvabilityResult } from "@/lib/tools/ai-solvability-shared"
import { cn } from "@/lib/utils"

const VERDICT_STYLES: Record<
  SolvabilityResult["verdict"],
  { ring: string; bg: string; text: string }
> = {
  solved_outright: {
    ring: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-900",
  },
  mostly_solved: {
    ring: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-950",
  },
  partially_solved: {
    ring: "border-amber-200",
    bg: "bg-amber-50/70",
    text: "text-amber-950",
  },
  resists_ai: {
    ring: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-950",
  },
}

export function SolvabilityResultPanel({
  result,
  question,
  libraryHighResistancePct,
  shareUrl,
  onCheckAnother,
  onShare,
  sharePending,
  shareCopied,
  showEmailForm,
  email,
  onEmailChange,
  onEmailSubmit,
  emailPending,
  emailSent,
}: {
  result: SolvabilityResult
  question?: string
  libraryHighResistancePct: number
  shareUrl?: string | null
  onCheckAnother?: () => void
  onShare?: () => void
  sharePending?: boolean
  shareCopied?: boolean
  showEmailForm?: boolean
  email?: string
  onEmailChange?: (value: string) => void
  onEmailSubmit?: () => void
  emailPending?: boolean
  emailSent?: boolean
}) {
  const styles = VERDICT_STYLES[result.verdict]

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "rounded-2xl border p-6 sm:p-8",
          styles.ring,
          styles.bg,
        )}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-ink-muted">
          Solvability verdict
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className={cn("text-3xl font-semibold tracking-tight", styles.text)}>
            {result.verdictLabel}
          </h2>
          <AiResistanceBadge level={result.aiResistance} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          This is one model&apos;s attempt on your prompt — not a guarantee. A
          different model, tooling, or determined candidate may do better or
          worse.
        </p>
        {result.cached ? (
          <p className="mt-2 text-xs text-ink-muted">
            Identical question — showing a cached result (no new model call).
          </p>
        ) : null}
      </div>

      {question ? (
        <section className="rounded-2xl border border-sage-line bg-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-pine">
            Your question
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {question}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-sage-line bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-pine">
          What the model produced
        </h3>
        <div className="mt-3 rounded-xl border border-sage-line/80 bg-paper p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
            {result.modelAttempt}
          </pre>
        </div>
      </section>

      <section className="rounded-2xl border border-sage-line bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-pine">
          Why it scored this way
        </h3>
        <ul className="mt-4 space-y-3">
          {result.properties.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
              <Check className="mt-0.5 size-4 shrink-0 text-pine" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-sage-line bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-pine">
          How to make it resistant
        </h3>
        <ul className="mt-4 space-y-6">
          {result.suggestions.map((item) => (
            <li key={item.description} className="space-y-3">
              <p className="text-sm leading-relaxed text-ink">{item.description}</p>
              {item.rewrittenQuestion ? (
                <CopyableRewrite text={item.rewrittenQuestion} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {onShare ? (
          <Button type="button" variant="outline" onClick={onShare} disabled={sharePending}>
            {shareCopied ? "Link copied" : sharePending ? "Creating link…" : "Share result"}
          </Button>
        ) : null}
        {shareUrl ? (
          <p className="w-full text-xs text-ink-muted">
            Share link:{" "}
            <Link href={shareUrl} className="font-medium text-pine underline-offset-2 hover:underline">
              {shareUrl}
            </Link>
          </p>
        ) : null}
        {onCheckAnother ? (
          <Button type="button" variant="secondary" onClick={onCheckAnother}>
            Check another question
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-pine/20 bg-pine/5 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-pine">
          Built into Vertana
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink">
          Vertana&apos;s library is scored this way — questions tagged for resistance
          before they reach your tests.{" "}
          <span className="font-semibold">{libraryHighResistancePct}%</span> of our
          library is rated high-resistance.
        </p>
        <Link
          href="/signup"
          onClick={() => {
            if (typeof window !== "undefined") {
              void import("@/lib/tools/ai-solvability-analytics").then(({ trackSolvabilityEvent }) =>
                trackSolvabilityEvent("solvability_cta_click"),
              )
            }
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep"
        >
          Try 10 candidates free
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/blog/ai-resistant-interview-questions" className="font-medium text-pine hover:underline">
            AI-resistant question playbook
          </Link>
          <Link href="/blog/hiring-in-the-age-of-ai-cheating" className="font-medium text-pine hover:underline">
            Hiring in the age of AI cheating
          </Link>
        </div>
      </div>

      {showEmailForm ? (
        <section className="rounded-2xl border border-sage-line bg-card p-6">
          <h3 className="text-base font-semibold text-ink">
            Email me this result + our AI-resistant question guide
          </h3>
          <p className="mt-2 text-sm text-ink-muted">
            Optional — no account required. One email, no newsletter unless you opt in elsewhere.
          </p>
          {emailSent ? (
            <p className="mt-4 text-sm font-medium text-pine">Thanks — we&apos;ll send it shortly.</p>
          ) : (
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                onEmailSubmit?.()
              }}
            >
              <input
                type="email"
                required
                value={email ?? ""}
                onChange={(e) => onEmailChange?.(e.target.value)}
                placeholder="you@company.com"
                className="h-10 flex-1 rounded-lg border border-sage-line bg-paper px-3 text-sm text-ink outline-none ring-pine focus-visible:ring-2"
              />
              <Button type="submit" disabled={emailPending}>
                {emailPending ? "Sending…" : "Send guide"}
              </Button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  )
}

function CopyableRewrite({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-sage-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{text}</p>
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(text)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-sage-line px-2 py-1 text-xs font-medium text-ink-muted hover:bg-sage"
          aria-label="Copy rewritten question"
        >
          <Copy className="size-3.5" aria-hidden />
          Copy
        </button>
      </div>
    </div>
  )
}
