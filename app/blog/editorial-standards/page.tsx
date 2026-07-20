import type { Metadata } from "next"
import Link from "next/link"

import { PageShell } from "@/components/marketing/page-shell"
import {
  BLOG_EDITORIAL_STANDARDS_PATH,
  BLOG_TEAM_BYLINE,
  BLOG_TEAM_DESCRIPTION,
} from "@/lib/marketing/blog-eeat"

export const metadata: Metadata = {
  title: "Editorial standards · Vertana Blog",
  description:
    "How Vertana's resource articles are written, sourced, updated, and published under a team byline.",
}

export default function BlogEditorialStandardsPage() {
  return (
    <PageShell>
      <section className="border-b border-sage-line/70 bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <Link
            href="/blog"
            className="text-sm font-medium text-pine hover:underline"
          >
            ← All articles
          </Link>
          <h1 className="mt-6 font-sans text-4xl font-semibold tracking-tight text-ink">
            Editorial standards
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            How we write, source, and update articles on the Vertana blog.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 prose prose-neutral prose-headings:font-sans prose-p:text-ink-muted">
          <h2>Who writes these articles</h2>
          <p>
            Every post is published under the team byline{" "}
            <strong>{BLOG_TEAM_BYLINE}</strong>. We do not use named individual
            authors or personal headshots on the blog. {BLOG_TEAM_DESCRIPTION}
          </p>

          <h2>How we source claims</h2>
          <ul>
            <li>
              Factual claims about hiring science, law, or industry practice
              include a citation in the <strong>Sources</strong> section at the
              end of the article, or are rewritten as clearly labelled opinion.
            </li>
            <li>
              We do not invent statistics, study results, or quotations. If we
              cannot verify a source, we leave it out or mark it for revision.
            </li>
            <li>
              Original figures come only from Vertana&apos;s own systems (for
              example, question-library composition) and are labelled as such.
            </li>
          </ul>

          <h2>Updates and corrections</h2>
          <p>
            Each article shows a <strong>Published</strong> date and an{" "}
            <strong>Updated</strong> date when the content has changed
            materially. Significant corrections include a note on the article
            page explaining what changed.
          </p>

          <h2>Product mentions</h2>
          <p>
            Some articles describe how Vertana implements the practices we
            recommend. Product references appear after the advice stands on its
            own and include a disclosure line. A reader who never uses Vertana
            should still leave with something actionable.
          </p>

          <h2>What we will not publish</h2>
          <ul>
            <li>Anonymous quotations presented as expert testimony</li>
            <li>Unverified legal advice stated as certainty</li>
            <li>Statistics without a traceable source</li>
            <li>Thin content below our editorial minimum for the topic</li>
          </ul>

          <h2>Contact</h2>
          <p>
            Spotted an error or have a source we should add? Email{" "}
            <a href="mailto:hello@vertana.io">hello@vertana.io</a> with the
            article URL and we will review it.
          </p>

          <p className="text-sm text-ink-muted">
            This page is linked from every article byline. Path:{" "}
            {BLOG_EDITORIAL_STANDARDS_PATH}
          </p>
        </article>
      </section>
    </PageShell>
  )
}
