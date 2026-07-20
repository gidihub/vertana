"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CmsAnnouncementRow } from "@/lib/cms/types"
import { formatDateTime } from "@/lib/format"

export default function CmsAnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [items, setItems] = useState<CmsAnnouncementRow[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  function loadAnnouncements() {
    setLoading(true)
    void fetch("/api/cms/announcements")
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error ?? "Failed to load announcements")
        }
        return res.json() as Promise<{ announcements: CmsAnnouncementRow[] }>
      })
      .then((data) => setItems(data.announcements))
      .catch((err) => {
        toast.error((err as Error).message)
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) return
    setSavingId(id)
    try {
      const res = await fetch(`/api/cms/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          body: editBody.trim(),
        }),
      })
      const data = (await res.json()) as {
        announcement?: CmsAnnouncementRow
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Update failed")
      if (data.announcement) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.announcement! : item)),
        )
      } else {
        loadAnnouncements()
      }
      setEditingId(null)
      toast.success("Announcement updated")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleTogglePublished(item: CmsAnnouncementRow) {
    setTogglingId(item.id)
    try {
      const res = await fetch(`/api/cms/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      })
      const data = (await res.json()) as {
        announcement?: CmsAnnouncementRow
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Update failed")
      if (data.announcement) {
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? data.announcement! : row)),
        )
      } else {
        loadAnnouncements()
      }
      toast.success(
        data.announcement?.published ? "Published" : "Unpublished",
      )
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setTogglingId(null)
    }
  }

  function startEditing(item: CmsAnnouncementRow) {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditBody(item.body ?? "")
  }

  function cancelEditing() {
    setEditingId(null)
    setEditTitle("")
    setEditBody("")
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/cms/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          published: false,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Create failed")
      toast.success("Announcement created")
      setTitle("")
      setBody("")
      loadAnnouncements()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">
          Announcements
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          In-app messages for users.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleCreate(e)}
        className="mb-8 space-y-3 rounded-xl border border-sage-line/70 bg-card p-4"
      >
        <div className="space-y-2">
          <Label htmlFor="ann-title">New announcement</Label>
          <Input
            id="ann-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (optional)"
          rows={3}
        />
        <Button
          type="submit"
          disabled={creating}
          className="bg-pine text-pine-foreground hover:bg-pine-deep"
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : null}
          Add draft
        </Button>
      </form>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading announcements…
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-sage-line/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-ink-muted">
                    No announcements yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Title"
                          />
                          <Textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            placeholder="Body (optional)"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={savingId === item.id}
                              className="bg-pine text-pine-foreground hover:bg-pine-deep"
                              onClick={() => void handleUpdate(item.id)}
                            >
                              {savingId === item.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : null}
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{item.title}</p>
                          {item.body ? (
                            <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                              {item.body}
                            </p>
                          ) : null}
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.published ? "default" : "secondary"}>
                        {item.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-ink-muted">
                      {formatDateTime(item.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? null : (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={togglingId === item.id}
                            onClick={() => void handleTogglePublished(item)}
                          >
                            {togglingId === item.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : item.published ? (
                              "Unpublish"
                            ) : (
                              "Publish"
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
