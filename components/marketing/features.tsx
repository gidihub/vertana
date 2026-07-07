import {
  IconSparkles,
  IconListCheck,
  IconCode,
  IconWriting,
  IconClock,
  IconCalendarDue,
  IconArrowsShuffle,
  IconEyeCheck,
  IconChartBar,
  IconFileSpreadsheet,
  type IconProps,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

type Feature = {
  icon: ComponentType<IconProps>
  name: string
  description: string
}

type Cluster = {
  label: string
  features: Feature[]
}

const clusters: Cluster[] = [
  {
    label: "Assessment types",
    features: [
      {
        icon: IconSparkles,
        name: "AI question generation",
        description: "Draft a full set from a prompt",
      },
      {
        icon: IconListCheck,
        name: "Multiple choice",
        description: "Auto-scored, marked answers",
      },
      {
        icon: IconWriting,
        name: "Short answer",
        description: "Capture written reasoning",
      },
      {
        icon: IconCode,
        name: "Coding questions",
        description: "Evaluate real coding skills",
      },
    ],
  },
  {
    label: "Delivery & integrity",
    features: [
      {
        icon: IconClock,
        name: "Time limits",
        description: "Cap how long each test runs",
      },
      {
        icon: IconCalendarDue,
        name: "Deadlines",
        description: "Close the link automatically",
      },
      {
        icon: IconArrowsShuffle,
        name: "Randomized order",
        description: "Shuffle questions per candidate",
      },
      {
        icon: IconEyeCheck,
        name: "Focus tracking",
        description: "Flag tab and focus loss",
      },
    ],
  },
  {
    label: "Reporting",
    features: [
      {
        icon: IconChartBar,
        name: "Results dashboard",
        description: "See the score distribution",
      },
      {
        icon: IconFileSpreadsheet,
        name: "CSV export",
        description: "Hand results to any panel",
      },
    ],
  },
]

export function Features() {
  return (
    <section id="product" className="border-b border-sage-line/70 bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            What&apos;s inside
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Everything you need to run a fair, verifiable screen
          </h2>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map((cluster) => (
            <div key={cluster.label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                {cluster.label}
              </p>
              <ul className="mt-5 flex flex-col gap-5">
                {cluster.features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-sage-line bg-paper text-pine">
                      <feature.icon
                        className="size-5"
                        stroke={1.75}
                        aria-hidden
                      />
                    </span>
                    <div className="pt-0.5">
                      <h3 className="text-sm font-semibold text-ink">
                        {feature.name}
                      </h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
