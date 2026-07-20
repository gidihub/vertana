"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CmsFeedbackRow } from "@/lib/cms/types"
import { formatDateTime } from "@/lib/format"

const STATUSES = ["new", "reviewed", "archived"] as const

export default function CmsFeedbackPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CmsFeedbackRow[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/cms/feedback")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? "Failed to load feedback")
        }
        return res.json() as Promise<{ feedback: CmsFeedbackRow[] }>
      })
      .then((data) => {
        if (!cancelled) setItems(data.feedback)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error((err as Error).message)
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function updateStatus(id: string, status: CmsFeedbackRow["status"]) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/cms/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = (await res.json()) as {
        feedback?: CmsFeedbackRow
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Update failed")
      setItems((prev) =>
        prev.map((item) => (item.id === id ? data.feedback! : item)),
      )
      toast.success("Status updated")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">
          Feedback
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Submissions from the website and app.
        </p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading feedback…
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-muted">No feedback yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-sage-line/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-md whitespace-normal">
                    <p className="line-clamp-3">{item.message}</p>
                    {item.page_url ? (
                      <p className="mt-1 truncate text-xs text-ink-muted">
                        {item.page_url}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell className="text-ink-muted">
                    {item.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) =>
                        void updateStatus(
                          item.id,
                          e.target.value as CmsFeedbackRow["status"],
                        )
                      }
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {formatDateTime(item.created_at)}
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
