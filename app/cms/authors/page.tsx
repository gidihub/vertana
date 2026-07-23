"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, UserRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { BlogAuthorRow } from "@/lib/cms/types"

export default function CmsAuthorsPage() {
  const [loading, setLoading] = useState(true)
  const [authors, setAuthors] = useState<BlogAuthorRow[]>([])

  useEffect(() => {
    let cancelled = false
    void fetch("/api/cms/authors")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? "Failed to load authors")
        }
        return res.json() as Promise<{ authors: BlogAuthorRow[] }>
      })
      .then((data) => {
        if (!cancelled) setAuthors(data.authors)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error((err as Error).message)
          setAuthors([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-semibold tracking-tight">
            Authors
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {loading
              ? "Loading…"
              : `${authors.length} author${authors.length === 1 ? "" : "s"} total`}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/cms/authors/new" />}
          className="bg-pine text-pine-foreground hover:bg-pine-deep"
        >
          <Plus className="size-4" />
          New author
        </Button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading authors…
        </p>
      ) : authors.length === 0 ? (
        <p className="text-sm text-ink-muted">No authors yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {authors.map((author) => (
            <li key={author.slug}>
              <article className="flex items-center gap-4 rounded-2xl border border-sage-line/80 bg-card p-5 shadow-sm transition-colors hover:border-pine/30">
                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage text-ink-muted">
                  {author.avatar_url ? (
                    <Image
                      src={author.avatar_url}
                      alt=""
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-6" aria-hidden />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-sans text-base font-semibold text-ink">
                      {author.name}
                    </h2>
                    {author.published ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-sage-line bg-sage px-2 py-0.5 text-xs font-semibold text-ink-muted">
                        Hidden
                      </span>
                    )}
                  </div>
                  {author.title ? (
                    <p className="mt-0.5 text-sm text-ink-muted">{author.title}</p>
                  ) : null}
                  <p className="mt-0.5 font-mono text-xs text-ink-muted">
                    /blog/authors/{author.slug}
                  </p>
                </div>

                <Link
                  href={`/cms/authors/${author.slug}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-ink-muted transition-colors hover:bg-sage hover:text-pine"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
