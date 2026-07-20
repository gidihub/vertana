"use client"

import { useEffect, useState } from "react"
import { Loader2, Megaphone, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { announcementMessage } from "@/lib/cms/announcements"
import type { CmsAnnouncementRow } from "@/lib/cms/types"

function AnnouncementCard({
  item,
  toggling,
  deleting,
  onToggle,
  onDelete,
}: {
  item: CmsAnnouncementRow
  toggling: boolean
  deleting: boolean
  onToggle: (next: boolean) => void
  onDelete: () => void
}) {
  const live = item.published

  return (
    <div
      className={
        live
          ? "flex items-center justify-between gap-4 rounded-xl border border-pine/25 bg-pine/5 px-5 py-4"
          : "flex items-center justify-between gap-4 rounded-xl border border-sage-line/70 bg-card px-5 py-4"
      }
    >
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
        {announcementMessage(item)}
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm text-ink-muted">{live ? "Live" : "Off"}</span>
        <Switch
          checked={live}
          disabled={toggling || deleting}
          onCheckedChange={onToggle}
          aria-label={live ? "Turn off announcement" : "Turn on announcement"}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={toggling || deleting}
          className="text-ink-muted hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete announcement"
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default function CmsAnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [items, setItems] = useState<CmsAnnouncementRow[]>([])
  const [message, setMessage] = useState("")
  const [ctaLabel, setCtaLabel] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  function resetForm() {
    setMessage("")
    setCtaLabel("")
    setCtaUrl("")
  }

  async function handleCreate() {
    if (!message.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/cms/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: message.trim(),
          title: ctaLabel.trim() || undefined,
          link_url: ctaUrl.trim() || null,
          published: false,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Create failed")
      toast.success("Announcement created")
      resetForm()
      setDialogOpen(false)
      loadAnnouncements()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(item: CmsAnnouncementRow, next: boolean) {
    setTogglingId(item.id)
    try {
      const res = await fetch(`/api/cms/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Update failed")
      toast.success(next ? "Announcement is live" : "Announcement turned off")
      loadAnnouncements()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cms/announcements/${id}`, {
        method: "DELETE",
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      toast.success("Announcement deleted")
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  const liveItems = items.filter((item) => item.published)
  const inactiveItems = items.filter((item) => !item.published)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="size-5 text-pine" aria-hidden />
            <h1 className="font-sans text-2xl font-semibold tracking-tight">
              Announcements
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            Manage the banner shown at the top of the public site. Only one can
            be active at a time.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 bg-pine text-pine-foreground hover:bg-pine-deep"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4" />
          New announcement
        </Button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading announcements…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sage-line/70 bg-card px-5 py-10 text-center text-sm text-ink-muted">
          No announcements yet. Create one to show a banner on the public site.
        </p>
      ) : (
        <div className="space-y-8">
          {liveItems.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Live
              </h2>
              <div className="mt-3 space-y-3">
                {liveItems.map((item) => (
                  <AnnouncementCard
                    key={item.id}
                    item={item}
                    toggling={togglingId === item.id}
                    deleting={deletingId === item.id}
                    onToggle={(next) => void handleToggle(item, next)}
                    onDelete={() => void handleDelete(item.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {inactiveItems.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Inactive
              </h2>
              <div className="mt-3 space-y-3">
                {inactiveItems.map((item) => (
                  <AnnouncementCard
                    key={item.id}
                    item={item}
                    toggling={togglingId === item.id}
                    deleting={deletingId === item.id}
                    onToggle={(next) => void handleToggle(item, next)}
                    onDelete={() => void handleDelete(item.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ann-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ann-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Free for teams under 5 — no credit card needed."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ann-cta-label">CTA label (optional)</Label>
                <Input
                  id="ann-cta-label"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Get started"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-cta-url">CTA URL (optional)</Label>
                <Input
                  id="ann-cta-url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="/signup"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={creating || !message.trim()}
              className="bg-pine text-pine-foreground hover:bg-pine-deep"
              onClick={() => void handleCreate()}
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
