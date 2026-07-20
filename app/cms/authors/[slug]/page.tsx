"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BlogAuthorRow } from "@/lib/cms/types"

export default function CmsAuthorEditPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [published, setPublished] = useState(true)

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
        setPublished(author.published)
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
          published,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      toast.success("Author saved")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
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

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <Link href="/cms/authors" className="text-sm text-pine hover:underline">
        ← Authors
      </Link>
      <h1 className="mt-4 font-sans text-2xl font-semibold">Edit author</h1>
      <p className="mt-1 text-sm text-ink-muted">/{slug}</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
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
          <Label htmlFor="title">Title</Label>
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
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar</Label>
          <Input
            id="avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => void handleAvatarUpload(e)}
            />
            <span className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-xs font-medium hover:bg-sage/50">
              Upload image
            </span>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="size-4 accent-pine"
          />
          Published on site
        </label>
        <Button
          type="submit"
          disabled={saving}
          className="bg-pine text-pine-foreground hover:bg-pine-deep"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>
    </div>
  )
}
