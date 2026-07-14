import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"

const PRODUCT_LINKS = [
  { label: "Test builder", href: "/features/test-builder" },
  { label: "AI question generation", href: "/features/ai-question-generation" },
  { label: "Proctoring", href: "/features/proctoring" },
  { label: "Results and reporting", href: "/features/results-reporting" },
]

const USE_CASE_LINKS = [
  { label: "Technical hiring", href: "/use-cases/technical-hiring" },
  { label: "Remote hiring", href: "/use-cases/remote-hiring" },
  { label: "High-volume screening", href: "/use-cases/high-volume-screening" },
  { label: "Recruitment agencies", href: "/use-cases/recruitment-agencies" },
  { label: "Graduate & campus hiring", href: "/use-cases/graduate-campus-hiring" },
  { label: "First technical hire", href: "/use-cases/first-technical-hire" },
]

const COMPARE_LINKS = [
  { label: "Vertana vs TestTrick", href: "/compare/vertana-vs-testtrick" },
  { label: "Vertana vs TestDome", href: "/compare/vertana-vs-testdome" },
  { label: "Vertana vs TestGorilla", href: "/compare/vertana-vs-testgorilla" },
  { label: "Vertana vs HackerRank", href: "/compare/vertana-vs-hackerrank" },
  { label: "Vertana vs Quilgo", href: "/compare/vertana-vs-quilgo" },
]

const LEGAL_LINKS = [
  { label: "Privacy policy", href: "/legal/privacy" },
  { label: "GDPR compliance", href: "/legal/gdpr" },
  { label: "Terms of use", href: "/legal/terms" },
  { label: "Data processing agreement", href: "/legal/dpa" },
]

const RESOURCE_LINKS = [
  { label: "Blog", href: "/blog" },
  { label: "Hiring assessments", href: "/assessments" },
  { label: "React developer test", href: "/assessments/react-developer-assessment" },
  { label: "Prevent interview cheating", href: "/blog/prevent-cheating-remote-technical-interviews" },
  { label: "Hiring in the age of AI", href: "/blog/hiring-in-the-age-of-ai-cheating" },
]

export function SiteFooter() {
  return (
    <footer className="bg-paper">
      {/* CTA band */}
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-pine p-8 text-pine-foreground sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Ready to hire on real signal?
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-pine-foreground/75">
              Build your first verifiable assessment in minutes. No credit card
              required.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-lime-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
          >
            Create your first test
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Link columns */}
      <div className="border-t border-sage-line/70">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:grid-cols-7">
          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Use cases" links={USE_CASE_LINKS} />
          <FooterColumn title="Compare" links={COMPARE_LINKS} />
          <FooterColumn title="Resources" links={RESOURCE_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-ink">Contact</h3>
            <address className="flex flex-col gap-3 text-sm not-italic leading-relaxed text-ink-muted">
              <a
                href="mailto:support@vertana.io"
                className="rounded transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                support@vertana.io
              </a>
            </address>
          </div>

          {/* Brand + social + copyright */}
          <div className="col-span-2 flex flex-col gap-4 md:col-span-3 lg:col-span-1">
            <Logo size={30} />
            <div className="flex items-center gap-2">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Vertana on LinkedIn"
                className="flex size-9 items-center justify-center rounded-full border border-sage-line transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <Image
                  src="/brand/linkedin.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 opacity-70"
                  aria-hidden
                />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Vertana on X"
                className="flex size-9 items-center justify-center rounded-full border border-sage-line transition-colors hover:bg-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <Image
                  src="/brand/x.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="size-3.5 opacity-70"
                  aria-hidden
                />
              </a>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              © {new Date().getFullYear()} Vertana, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="rounded text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
