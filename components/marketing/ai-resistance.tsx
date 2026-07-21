import {
  IconRobotOff,
  IconSparkles,
  IconTerminal2,
  IconShieldCheck,
  type IconProps,
} from "@tabler/icons-react"
import type { ComponentType } from "react"
import Link from "next/link"

type Card = {
  icon: ComponentType<IconProps>
  title: string
  body: string
}

const CARDS: Card[] = [
  {
    icon: IconRobotOff,
    title: "AI-resistant by design",
    body: "Every library question is screened for how easily an LLM solves it. The ones a model can ace on its own don't make the cut — what's left measures judgment a candidate can't outsource to ChatGPT.",
  },
  {
    icon: IconSparkles,
    title: "AI-assisted work samples",
    body: "Modern work uses AI, so we test for it. Work-sample questions score how well a candidate directs and edits AI output — not whether they avoided it — because that's the skill you're actually hiring for.",
  },
  {
    icon: IconTerminal2,
    title: "Real execution, real reasoning",
    body: "Coding questions run in a sandboxed environment against real test cases, and short-answer questions capture the thinking behind the work. You see how someone builds and reasons, not just a final block of text.",
  },
  {
    icon: IconShieldCheck,
    title: "Integrity without theatre",
    body: "Monitoring is consented, disclosed, and proportionate: tab-focus tracking on every plan, optional camera proctoring on paid tiers. Evidence you can weigh fairly, not a surveillance cage that punishes honest candidates.",
  },
]

const ALSO_INCLUDED = [
  "Time limits",
  "Deadlines",
  "Randomized order",
  "Results dashboard",
  "CSV export",
]

export function AiResistance() {
  return (
    <section id="product" className="border-b border-sage-line/70 bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            The problem nobody else is solving
          </p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            They catch cheaters. We make cheating pointless.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Every other tool treats AI as an arms race — more lockdown, more
            webcams, more blocked apps. That&rsquo;s a losing game. We design
            assessments an AI can&rsquo;t complete for the candidate, and treat
            monitoring as consented evidence rather than a cage. The result is a
            screen that stays meaningful even as the models get better.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-2xl border border-sage-line bg-paper p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-pine/10 text-pine">
                <card.icon className="size-5" stroke={1.75} aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {card.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
          <span className="font-semibold text-ink">Also included:</span>
          {ALSO_INCLUDED.map((item, i) => (
            <span key={item} className="inline-flex items-center gap-2">
              {i > 0 ? <span aria-hidden className="text-sage-line">·</span> : null}
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/tools/ai-solvability-checker"
            className="inline-flex items-center gap-2 rounded-full border border-pine/30 bg-paper px-5 py-2.5 text-sm font-semibold text-pine transition-colors hover:border-pine/50 hover:bg-sage/40"
          >
            Try the free AI solvability checker
          </Link>
        </div>
      </div>
    </section>
  )
}
