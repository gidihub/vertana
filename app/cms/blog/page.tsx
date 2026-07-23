"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { BlogPostRow } from "@/lib/cms/types"
import { formatDate } from "@/lib/format"

type ImportSummary = {
  total: number
  slugs: string[]
}

function StatusBadge({ status }: { status: BlogPostRow["status"] }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold lowercase text-emerald-700">
        published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-sage-line bg-sage px-2.5 py-0.5 text-xs font-semibold lowercase text-ink-muted">
      draft
    </span>
  )
}

export default function CmsBlogListPage() {
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [posts, setPosts] = useState<BlogPostRow[]>([])
  const [legacySummary, setLegacySummary] = useState<ImportSummary | null>(
    null,
  )

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/cms/blog")
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error ?? "Failed to load posts")
    }
    const data = (await res.json()) as { posts: BlogPostRow[] }
    setPosts(data.posts)
  }, [])

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      loadPosts(),
      fetch("/api/cms/blog/import-legacy")
        .then(async (res) => {
          if (!res.ok) return null
          return res.json() as Promise<ImportSummary>
        })
        .catch(() => null),
    ])
      .then(([, summary]) => {
        if (!cancelled && summary) setLegacySummary(summary)
      })
      .catch((err) => {
        if (!cancelled) toast.error((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadPosts])

  async function handleImportLegacy() {
    setImporting(true)
    try {
      const res = await fetch("/api/cms/blog/import-legacy", {
        method: "POST",
      })
      const data = (await res.json()) as {
        imported?: number
        skipped?: number
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Import failed")

      if (data.imported) {
        toast.success(
          `Imported ${data.imported} article${data.imported === 1 ? "" : "s"} from the legacy blog`,
        )
      } else {
        toast.message("All legacy articles are already in the CMS")
      }
      await loadPosts()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-semibold tracking-tight">
            Blog
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {loading
              ? "Loading…"
              : `${posts.length} post${posts.length === 1 ? "" : "s"} total`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {legacySummary && legacySummary.total > posts.length ? (
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => void handleImportLegacy()}
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Import legacy posts
            </Button>
          ) : null}
          <Button
            nativeButton={false}
            render={<Link href="/cms/blog/new" />}
            className="bg-pine text-pine-foreground hover:bg-pine-deep"
          >
            <Plus className="size-4" />
            New Post
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading posts…
        </p>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-pine" />
              No posts in the CMS yet
            </CardTitle>
            <CardDescription>
              Your public blog still shows {legacySummary?.total ?? 7} legacy
              articles from code. Import them to edit, preview, and manage here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="bg-pine text-pine-foreground hover:bg-pine-deep"
              disabled={importing}
              onClick={() => void handleImportLegacy()}
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Import {legacySummary?.total ?? 7} legacy posts
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/cms/blog/new" />}
            >
              <Plus className="size-4" />
              Write a new post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="rounded-2xl border border-sage-line/80 bg-card p-5 shadow-sm transition-colors hover:border-pine/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={post.status} />
                      <span className="inline-flex items-center rounded-full border border-sage-line bg-sage px-2.5 py-0.5 text-xs font-semibold text-ink">
                        {post.category}
                      </span>
                    </div>
                    <Link href={`/cms/blog/${post.id}`} className="mt-3 block group">
                      <h2 className="font-sans text-lg font-semibold tracking-tight text-ink group-hover:text-pine">
                        {post.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-1 text-sm leading-relaxed text-ink-muted">
                        {post.excerpt}
                      </p>
                    </Link>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5" aria-hidden />
                        {formatDate(post.published_at ?? post.updated_at)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden />
                        {post.read_time}
                      </span>
                      <span>by {post.author}</span>
                      {post.status === "published" ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-pine hover:underline"
                        >
                          View live
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={`/cms/blog/${post.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-ink-muted transition-colors hover:bg-sage hover:text-pine"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
