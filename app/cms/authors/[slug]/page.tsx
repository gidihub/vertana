"use client"

import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Eye,
  Globe,
  Loader2,
  Save,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { BlogAuthorRow } from "@/lib/cms/types"

export default function CmsAuthorEditPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [twitterUrl, setTwitterUrl] = useState("")
  const [published, setPublished] = useState(true)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/cms/authors/${slug}`)
      .then(async (res) => {
        const body = (await res.json()) as {
          author?: BlogAuthorRow
          error?: string
        }
        if (!res.ok) throw new Error(body.error ?? "Failed to load author")
        if (!body.author) throw new Error("Author data missing from response")
        return body.author
      })
      .then((author) => {
        if (cancelled) return
        setName(author.name)
        setTitle(author.title)
        setBio(author.bio)
        setAvatarUrl(author.avatar_url ?? "")
        setLinkedinUrl(author.linkedin_url ?? "")
        setTwitterUrl(author.twitter_url ?? "")
        setPublished(author.published)
        setCreatedAt(author.created_at)
        setUpdatedAt(author.updated_at)
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
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/authors/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          twitter_url: twitterUrl.trim() || null,
          published,
        }),
      })
      const data = (await res.json()) as {
        author?: BlogAuthorRow
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      if (data.author?.updated_at) setUpdatedAt(data.author.updated_at)
      toast.success("Author saved")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${name || "this author"}? This can't be undone.`))
      return
    setDeleting(true)
    try {
      const res = await fetch(`/api/cms/authors/${slug}`, { method: "DELETE" })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      toast.success("Author deleted")
      router.push("/cms/authors")
    } catch (err) {
      toast.error((err as Error).message)
      setDeleting(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/cms/authors/upload-avatar", {
        method: "POST",
        body: form,
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setAvatarUrl(data.url ?? "")
      toast.success("Avatar uploaded")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-6 py-10 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" />
        Loading author…
      </div>
    )
  }

  const publicPath = `/blog/authors/${slug}`

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto max-w-5xl px-6 py-10"
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">
          Edit author
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/cms/authors" />}
          >
            Cancel
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={
              <Link href={publicPath} target="_blank" rel="noopener noreferrer" />
            }
          >
            <Eye className="size-4" />
            View public page
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-pine text-pine-foreground hover:bg-pine-deep"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={deleting}
            onClick={() => void handleDelete()}
            aria-label="Delete author"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: core fields */}
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex overflow-hidden rounded-lg border border-input">
                <span className="flex items-center bg-sage px-3 font-mono text-sm text-ink-muted">
                  /blog/authors/
                </span>
                <input
                  id="slug"
                  value={slug}
                  readOnly
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: sidebar cards */}
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div>
                <p className="text-sm font-medium text-ink">Published</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Visible at {publicPath}
                </p>
              </div>
              <Switch
                checked={published}
                onCheckedChange={setPublished}
                aria-label="Published on site"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm">Avatar</CardTitle>
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => void handleAvatarUpload(e)}
                />
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input px-3 text-xs font-medium hover:bg-sage/50">
                  <Upload className="size-3.5" />
                  Upload image
                </span>
              </label>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage text-ink-muted">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-ink-muted">
                    {avatarUrl || "No avatar set"}
                  </p>
                  {avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <X className="size-3" />
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-xs text-ink-muted">
                  Or paste a URL manually
                </Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="/authors/name.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/…"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X URL</Label>
                <Input
                  id="twitter"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/…"
                />
              </div>
            </CardContent>
          </Card>

          {createdAt || updatedAt ? (
            <Card>
              <CardContent className="space-y-2 pt-6 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-muted">Created</span>
                  <span className="text-ink">
                    {createdAt ? new Date(createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-muted">Last updated</span>
                  <span className="text-ink">
                    {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-pine text-pine-foreground hover:bg-pine-deep"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Globe className="size-4" />
          )}
          Save changes
        </Button>
      </div>
    </form>
  )
}
