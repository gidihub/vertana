"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { ExternalLink, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { RichTextEditor } from "@/components/cms/rich-text-editor"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BlogAuthorRow, BlogPostRow } from "@/lib/cms/types"
import { estimateReadTime, slugifyTitle } from "@/lib/cms/types"
import { formatDateTime } from "@/lib/format"

type SaveMode = "draft" | "published"

export function BlogEditor({ postId: initialPostId }: { postId?: string }) {
  const router = useRouter()
  const [postId, setPostId] = useState(initialPostId)
  const [loading, setLoading] = useState(Boolean(initialPostId))
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [authors, setAuthors] = useState<BlogAuthorRow[]>([])
  const [slugTouched, setSlugTouched] = useState(false)
  const [readTimeTouched, setReadTimeTouched] = useState(false)
  const [useCustomAuthor, setUseCustomAuthor] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [status, setStatus] = useState<"draft" | "published">("draft")

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("Guides")
  const [author, setAuthor] = useState("vertana-team")
  const [customAuthor, setCustomAuthor] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [readTime, setReadTime] = useState("5 min read")

  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSavedRef = useRef("")
  const buildPayloadRef = useRef<(() => ReturnType<typeof Object>) | null>(null)
  const savePostRef = useRef<
    ((mode: SaveMode, silent?: boolean) => Promise<boolean>) | null
  >(null)
  const statusRef = useRef(status)
  const titleRef = useRef(title)
  const slugRef = useRef(slug)

  const authorSlug = useCustomAuthor ? customAuthor.trim() : author

  const buildPayload = useCallback(() => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    return {
      title: title.trim(),
      slug: slug.trim() || slugifyTitle(title),
      excerpt: excerpt.trim(),
      content,
      category: category.trim() || "Guides",
      author: authorSlug || "vertana-team",
      cover_image_url: coverImageUrl.trim() || null,
      read_time: readTime.trim() || estimateReadTime(content),
      tags,
    }
  }, [
    authorSlug,
    category,
    content,
    coverImageUrl,
    excerpt,
    readTime,
    slug,
    tagsInput,
    title,
  ])

  useEffect(() => {
    void fetch("/api/cms/authors")
      .then(async (res) => {
        if (!res.ok) return { authors: [] as BlogAuthorRow[] }
        return res.json() as Promise<{ authors: BlogAuthorRow[] }>
      })
      .then((data) => setAuthors(data.authors))
      .catch(() => setAuthors([]))
  }, [])

  useEffect(() => {
    if (!initialPostId) return
    let cancelled = false
    void fetch(`/api/cms/blog/${initialPostId}`)
      .then(async (res) => {
        const body = (await res.json()) as { post?: BlogPostRow; error?: string }
        if (!res.ok) throw new Error(body.error ?? "Failed to load post")
        if (!body.post) throw new Error("Post data missing from response")
        return body.post
      })
      .then((post) => {
        if (cancelled) return
        setTitle(post.title)
        setSlug(post.slug)
        setSlugTouched(true)
        setExcerpt(post.excerpt)
        setContent(post.content)
        setCategory(post.category)
        setAuthor(post.author)
        setTagsInput(post.tags.join(", "))
        setCoverImageUrl(post.cover_image_url ?? "")
        setReadTime(post.read_time)
        setReadTimeTouched(true)
        setStatus(post.status)
        setUpdatedAt(post.updated_at)
        setPublishedAt(post.published_at)
        lastSavedRef.current = JSON.stringify({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          author: post.author,
          tags: post.tags,
          cover_image_url: post.cover_image_url,
          read_time: post.read_time,
          status: post.status,
        })
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
  }, [initialPostId])

  useEffect(() => {
    if (!initialPostId || authors.length === 0) return
    const postAuthor = author
    if (postAuthor && !authors.some((a) => a.slug === postAuthor)) {
      setUseCustomAuthor(true)
      setCustomAuthor(postAuthor)
    }
  }, [authors, author, initialPostId])

  useEffect(() => {
    if (slugTouched) return
    setSlug(slugifyTitle(title))
  }, [title, slugTouched])

  useEffect(() => {
    if (readTimeTouched) return
    setReadTime(estimateReadTime(content))
  }, [content, readTimeTouched])

  const savePost = useCallback(
    async (mode: SaveMode, silent = false) => {
      const payload = buildPayload()
      if (!payload.title) {
        if (!silent) toast.error("Title is required")
        return false
      }
      if (!payload.slug) {
        if (!silent) toast.error("Slug is required")
        return false
      }

      setSaving(true)
      try {
        const body = { ...payload, status: mode }
        const res = postId
          ? await fetch(`/api/cms/blog/${postId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch("/api/cms/blog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })

        const data = (await res.json()) as {
          post?: BlogPostRow
          error?: string
        }
        if (!res.ok) throw new Error(data.error ?? "Save failed")
        if (!data.post) throw new Error("Post data missing from response")

        const post = data.post
        setPostId(post.id)
        setStatus(post.status)
        setUpdatedAt(post.updated_at)
        setPublishedAt(post.published_at)
        lastSavedRef.current = JSON.stringify({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          author: post.author,
          tags: post.tags,
          cover_image_url: post.cover_image_url,
          read_time: post.read_time,
          status: post.status,
        })

        if (!initialPostId && post.id) {
          router.replace(`/cms/blog/${post.id}`)
        }

        if (!silent) {
          toast.success(mode === "published" ? "Published" : "Draft saved")
        }
        return true
      } catch (err) {
        if (!silent) toast.error((err as Error).message)
        return false
      } finally {
        setSaving(false)
      }
    },
    [buildPayload, initialPostId, postId, router],
  )

  buildPayloadRef.current = buildPayload
  savePostRef.current = savePost
  statusRef.current = status
  titleRef.current = title
  slugRef.current = slug

  useEffect(() => {
    if (!postId) return

    autoSaveRef.current = setInterval(() => {
      if (!titleRef.current.trim() || !slugRef.current.trim()) return
      const payload = buildPayloadRef.current?.()
      if (!payload) return
      const snapshot = JSON.stringify({ ...payload, status: statusRef.current })
      if (snapshot === lastSavedRef.current) return
      void savePostRef.current?.(statusRef.current, true).then((ok) => {
        if (ok) toast.message("Auto-saved")
      })
    }, 30_000)

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [postId])

  async function handleUploadFeatured(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/cms/blog/upload-featured", {
        method: "POST",
        body: form,
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setCoverImageUrl(data.url ?? "")
      toast.success("Image uploaded")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleGenerateFeatured() {
    if (!title.trim()) {
      toast.error("Add a title first")
      return
    }
    try {
      const res = await fetch("/api/cms/blog/generate-featured-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Generation failed")
      setCoverImageUrl(data.url ?? "")
      toast.success("Featured image generated")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleGenerateTags() {
    try {
      const res = await fetch("/api/cms/blog/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })
      const data = (await res.json()) as { tags?: string[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to suggest tags")
      if (data.tags?.length) {
        setTagsInput(data.tags.join(", "))
        toast.success("Tags updated")
      }
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleGenerateCategory() {
    try {
      const res = await fetch("/api/cms/blog/generate-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content,
        }),
      })
      const data = (await res.json()) as { category?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to suggest category")
      if (data.category) {
        setCategory(data.category)
        toast.success("Category updated")
      }
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleDelete() {
    if (!postId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/blog/${postId}`, { method: "DELETE" })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      toast.success("Post deleted")
      router.push("/cms/blog")
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
      setDeleteOpen(false)
    }
  }

  function handlePreview() {
    const previewSlug = slug.trim() || slugifyTitle(title)
    if (!previewSlug) {
      toast.error("Add a slug before previewing")
      return
    }
    window.open(`/blog/${previewSlug}?preview=true`, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-6 py-10 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" />
        Loading post…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight">
            {postId ? "Edit post" : "New post"}
          </h1>
          {updatedAt ? (
            <p className="mt-1 text-xs text-ink-muted">
              Updated {formatDateTime(updatedAt)}
              {publishedAt ? ` · Published ${formatDateTime(publishedAt)}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handlePreview}>
            <ExternalLink className="size-4" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => void savePost("draft")}
          >
            Save draft
          </Button>
          <Button
            type="button"
            className="bg-pine text-pine-foreground hover:bg-pine-deep"
            disabled={saving}
            onClick={() => void savePost("published")}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Publish now
          </Button>
          {postId ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              title="Delete post"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="url-slug"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Meta description</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for SEO and cards"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void handleGenerateCategory()}
                  >
                    AI suggest
                  </Button>
                </div>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="author">Author</Label>
                  <Link
                    href="/cms/authors/new"
                    className="text-xs font-medium text-pine hover:underline"
                  >
                    + New
                  </Link>
                </div>
                {!useCustomAuthor ? (
                  <select
                    id="author"
                    value={author}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setUseCustomAuthor(true)
                        setCustomAuthor(author)
                      } else {
                        setAuthor(e.target.value)
                      }
                    }}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {authors.map((a) => (
                      <option key={a.slug} value={a.slug}>
                        {a.name}
                      </option>
                    ))}
                    <option value="__custom__">Custom value…</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={customAuthor}
                      onChange={(e) => setCustomAuthor(e.target.value)}
                      placeholder="author-slug"
                    />
                    <button
                      type="button"
                      className="text-xs text-pine hover:underline"
                      onClick={() => setUseCustomAuthor(false)}
                    >
                      Use author list
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void handleGenerateTags()}
                  >
                    AI suggest
                  </Button>
                </div>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="hiring, assessments"
                />
                <p className="text-xs text-ink-muted">Comma-separated</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Cover image URL</Label>
                <Input
                  id="cover"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://…"
                />
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => void handleUploadFeatured(e)}
                    />
                    <span className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-xs font-medium hover:bg-sage/50">
                      Upload
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={!title.trim()}
                    onClick={() => void handleGenerateFeatured()}
                  >
                    AI Generate
                  </Button>
                </div>
                {coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImageUrl}
                    alt=""
                    className="mt-2 max-h-40 rounded-lg border border-sage-line object-cover"
                  />
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="read-time">Read time</Label>
                <Input
                  id="read-time"
                  value={readTime}
                  onChange={(e) => {
                    setReadTimeTouched(true)
                    setReadTime(e.target.value)
                  }}
                />
              </div>

              <p className="text-xs text-ink-muted">
                Status:{" "}
                <span className="font-medium text-ink">{status}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              This soft-deletes the post. It will no longer appear on the public
              blog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
