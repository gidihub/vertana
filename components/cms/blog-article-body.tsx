import { sanitizeHtml } from "@/lib/cms/sanitize-html"

export function CmsArticleBody({ html }: { html: string }) {
  const safe = sanitizeHtml(html)
  if (!safe) {
    return (
      <p className="text-base leading-relaxed text-ink-muted">
        This article has no content yet.
      </p>
    )
  }

  return (
    <div
      className="prose prose-neutral max-w-none prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-2xl prose-h3:mt-8 prose-h3:text-xl prose-p:leading-relaxed prose-p:text-ink-muted prose-li:text-ink-muted prose-strong:text-ink prose-a:text-pine prose-a:no-underline hover:prose-a:underline"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
