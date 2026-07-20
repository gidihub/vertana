"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { slugifyTitle } from "@/lib/cms/types"

export default function CmsAuthorNewPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugifyTitle(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/cms/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim() || slugifyTitle(name),
          name: name.trim(),
          title: title.trim(),
          bio: bio.trim(),
        }),
      })
      const data = (await res.json()) as { author?: { slug: string }; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Create failed")
      if (!data.author?.slug) throw new Error("Author data missing from response")
      toast.success("Author created")
      router.push(`/cms/authors/${data.author.slug}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <Link href="/cms/authors" className="text-sm text-pine hover:underline">
        ← Authors
      </Link>
      <h1 className="mt-4 font-sans text-2xl font-semibold">New author</h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
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
        <Button
          type="submit"
          disabled={saving}
          className="bg-pine text-pine-foreground hover:bg-pine-deep"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Create author
        </Button>
      </form>
    </div>
  )
}
