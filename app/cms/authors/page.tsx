"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight">
            Authors
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Bylines shown on blog posts.
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
      ) : (
        <div className="overflow-hidden rounded-xl border border-sage-line/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authors.map((author) => (
                <TableRow key={author.slug}>
                  <TableCell>
                    <Link
                      href={`/cms/authors/${author.slug}`}
                      className="font-medium hover:text-pine hover:underline"
                    >
                      {author.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-muted">{author.slug}</TableCell>
                  <TableCell>{author.title}</TableCell>
                  <TableCell>
                    <Badge variant={author.published ? "default" : "secondary"}>
                      {author.published ? "Published" : "Hidden"}
                    </Badge>
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
