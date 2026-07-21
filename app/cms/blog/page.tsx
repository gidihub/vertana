"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  ExternalLink,
  FileText,
  LayoutGrid,
  List,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { BlogPostRow } from "@/lib/cms/types"
import { formatDateTime } from "@/lib/format"

type ImportSummary = {
  total: number
  slugs: string[]
}

type ViewMode = "table" | "cards"

function StatusBadge({ status }: { status: BlogPostRow["status"] }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-pine px-2.5 py-0.5 text-xs font-semibold lowercase text-pine-foreground">
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
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [posts, setPosts] = useState<BlogPostRow[]>([])
  const [legacySummary, setLegacySummary] = useState<ImportSummary | null>(
    null,
  )
  const [view, setView] = useState<ViewMode>("table")

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

  const publishedCount = posts.filter((p) => p.status === "published").length
  const draftCount = posts.filter((p) => p.status === "draft").length

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight">
            Blog posts
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Draft and published articles for the public blog.
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
            New post
          </Button>
        </div>
      </div>

      {!loading && posts.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total posts</CardDescription>
              <CardTitle className="text-2xl">{posts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-2xl">{publishedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Drafts</CardDescription>
              <CardTitle className="text-2xl">{draftCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      {!loading && posts.length > 0 ? (
        <div className="mb-4 flex justify-end gap-1 rounded-lg border border-sage-line/70 bg-card p-1">
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "secondary" : "ghost"}
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
          >
            <List className="size-4" />
            Table
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "cards" ? "secondary" : "ghost"}
            onClick={() => setView("cards")}
            aria-pressed={view === "cards"}
          >
            <LayoutGrid className="size-4" />
            Cards
          </Button>
        </div>
      ) : null}

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
      ) : view === "cards" ? (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="rounded-2xl border border-sage-line/80 bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={post.status} />
                    <span className="inline-flex items-center rounded-full border border-sage-line bg-sage px-2.5 py-0.5 text-xs font-semibold text-ink">
                      {post.category}
                    </span>
                  </div>
                  <Link
                    href={`/cms/blog/${post.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-pine"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </div>
                <Link
                  href={`/cms/blog/${post.id}`}
                  className="mt-3 block group"
                >
                  <h2 className="font-sans text-lg font-semibold tracking-tight text-ink group-hover:text-pine">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                    {post.excerpt}
                  </p>
                </Link>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                  <span>{formatDateTime(post.updated_at)}</span>
                  <span>{post.read_time}</span>
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
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-xl border border-sage-line/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow
                  key={post.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/cms/blog/${post.id}`)}
                >
                  <TableCell>
                    <Link
                      href={`/cms/blog/${post.id}`}
                      className="font-medium text-ink hover:text-pine hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 rounded-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-ink-muted">/{post.slug}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={post.status} />
                  </TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {post.author}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {formatDateTime(post.updated_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {post.status === "published" ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-ink-muted hover:text-pine"
                        title="View live"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                    ) : (
                      <Link
                        href={`/blog/${post.slug}?preview=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-ink-muted hover:text-pine"
                        title="Preview draft"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
