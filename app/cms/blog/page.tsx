"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
                <TableRow key={post.id}>
                  <TableCell>
                    <Link
                      href={`/cms/blog/${post.id}`}
                      className="font-medium text-ink hover:text-pine hover:underline"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-ink-muted">/{post.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {post.author}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {formatDateTime(post.updated_at)}
                  </TableCell>
                  <TableCell>
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
