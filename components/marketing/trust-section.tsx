import { ShieldCheck, Eye, CalendarClock, UserCheck } from "lucide-react"

const POINTS = [
  {
    icon: UserCheck,
    title: "Consent is required",
    body: "Integrity monitoring never starts silently. Candidates must explicitly agree before any tab-focus tracking begins.",
  },
  {
    icon: Eye,
    title: "Clearly disclosed",
    body: "Exactly what's captured is shown up front in plain language: tab switches and session timing on every proctored test, plus a one-time JPEG/PNG camera snapshot at test start when camera verification is enabled — uploaded for identity checks, reviewed only by the hiring team, and deleted after 90 days.",
  },
  {
    icon: CalendarClock,
    title: "Retained on a schedule",
    body: "Session data is kept only for a defined window tied to the hiring decision, then removed. No indefinite storage.",
  },
]

export function TrustSection() {
  return (
    <section className="bg-pine-deep text-pine-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-pine-foreground/20 px-3 py-1 text-xs font-medium text-pine-foreground/80">
              <ShieldCheck className="size-4 text-lime" aria-hidden />
              Trust &amp; compliance
            </span>
            <h2 className="mt-5 font-sans text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Verification that respects the candidate
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-pine-foreground/75 text-pretty">
              Monitoring only earns trust when it's honest. Proctoring is
              optional, consent-first, and fully disclosed — because a fair
              process is part of the signal too.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {POINTS.map((point) => (
              <li
                key={point.title}
                className="flex gap-4 rounded-2xl border border-pine-foreground/15 bg-pine/40 p-5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lime text-lime-ink">
                  <point.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{point.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-pine-foreground/75">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
