import Link from "next/link"
import { ArrowRight, Check, Circle, ShieldCheck, Timer } from "lucide-react"

const OPTIONS = [
  { key: "A", label: "useMemo", state: "idle" },
  { key: "B", label: "useSyncExternalStore", state: "selected" },
  { key: "C", label: "useDeferredValue", state: "idle" },
  { key: "D", label: "useImperativeHandle", state: "idle" },
] as const

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-sage-line/70">
      {/* subtle paper grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,var(--color-sage-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-sage-line)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sage-line bg-paper px-3 py-1 text-xs font-medium text-ink-muted">
            <span className="flex size-4 items-center justify-center rounded-full bg-lime text-lime-ink">
              <Check className="size-3" />
            </span>
            Pre-hire skill assessments
          </span>

          <h1 className="mt-5 font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl">
            Stop guessing from résumés. Hire on{" "}
            <span className="relative whitespace-nowrap">
              verified
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-lime/70"
              />
            </span>{" "}
            signal.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted text-pretty">
            Vertana turns the résumé guessing game into a real, timed test every
            candidate actually takes. Build assessments in minutes, invite
            candidates, optionally monitor tab focus with consent, and get a ranked,
            auditable result you can defend.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pine px-6 py-3 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Create your first test
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-line bg-transparent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              See how it works
            </a>
          </div>

          <p className="mt-6 text-sm text-ink-muted">
            No credit card to start · Free while you evaluate · Consent-first
            proctoring
          </p>
        </div>

        {/* Live test mock */}
        <div className="relative flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-sage-line bg-card p-4 shadow-[0_24px_60px_-30px_rgba(14,74,52,0.45)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  Frontend Engineer Screening
                </p>
                <p className="text-xs text-ink-muted">Question 3 of 8</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-line bg-paper px-2.5 py-1 font-mono text-xs font-medium text-ink">
                <Timer className="size-3.5 text-pine" aria-hidden />
                11:42
              </span>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sage">
              <div className="h-full w-[37%] rounded-full bg-pine" />
            </div>

            <p className="mt-5 text-base font-medium leading-relaxed text-ink text-pretty">
              Which React hook lets you safely read from an external store
              without tearing during concurrent rendering?
            </p>

            <ul className="mt-4 flex flex-col gap-2">
              {OPTIONS.map((opt) => {
                const selected = opt.state === "selected"
                return (
                  <li
                    key={opt.key}
                    className={
                      selected
                        ? "flex items-center gap-3 rounded-xl border-2 border-pine bg-pine/5 px-3 py-2.5"
                        : "flex items-center gap-3 rounded-xl border border-sage-line bg-paper px-3 py-2.5"
                    }
                  >
                    <span
                      className={
                        selected
                          ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-pine text-[11px] font-semibold text-pine-foreground"
                          : "flex size-6 shrink-0 items-center justify-center rounded-full border border-sage-line text-[11px] font-semibold text-ink-muted"
                      }
                    >
                      {selected ? <Check className="size-3.5" aria-hidden /> : opt.key}
                    </span>
                    <span
                      className={
                        selected
                          ? "font-mono text-sm font-medium text-ink"
                          : "font-mono text-sm text-ink-muted"
                      }
                    >
                      {opt.label}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-sage-line pt-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-lime opacity-70 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-lime" />
                </span>
                Proctoring on · camera verified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-pine-foreground">
                Next
                <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </div>
          </div>

          {/* Floating verified-result chip */}
          <div className="absolute -bottom-5 -left-2 hidden w-56 rotate-[-3deg] rounded-xl border border-sage-line bg-card p-3 shadow-[0_18px_40px_-24px_rgba(14,74,52,0.5)] sm:block lg:-left-8">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-pine text-pine-foreground">
                <ShieldCheck className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="text-xs text-ink-muted">Verified score</p>
                <p className="font-sans text-lg font-semibold leading-none text-ink">
                  92% · Top 5%
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
              <Circle className="size-2 fill-lime text-lime" aria-hidden />
              No tab switches · Full session logged
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
