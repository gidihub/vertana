import { FileText, Send, MonitorCheck, BarChart3 } from "lucide-react"

const STEPS = [
  {
    icon: FileText,
    title: "Build a test",
    body: "Write questions or let AI draft a role-specific set. Set a time limit, deadline, and randomize the order.",
  },
  {
    icon: Send,
    title: "Invite candidates",
    body: "Share one secure link. Each candidate gets a unique session — no accounts or installs required.",
  },
  {
    icon: MonitorCheck,
    title: "They take it — optionally proctored",
    body: "With consent, the session is monitored: camera verification and tab-switch tracking, clearly disclosed up front.",
  },
  {
    icon: BarChart3,
    title: "See ranked, verified results",
    body: "Auto-scored submissions land in a dashboard sorted by signal, with a full activity trail and CSV export.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-sage-line/70 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-pine">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            From open role to verified shortlist in four steps
          </h2>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col rounded-2xl border border-sage-line bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-pine/10 text-pine">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="font-mono text-sm font-semibold text-ink-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
