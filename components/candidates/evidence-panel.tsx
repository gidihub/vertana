"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { loadProctoringMedia, type ProctoringMediaView } from "@/lib/store"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Fact {
  label: string
  value: string
  /** "good" → green pill, "bad" → amber pill, otherwise plain text. */
  tone?: "good" | "bad" | "neutral"
}

function FactValue({ value, tone }: { value: string; tone?: Fact["tone"] }) {
  if (tone === "good" || tone === "bad") {
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-sm font-medium",
          tone === "good"
            ? "bg-success/15 text-success"
            : "bg-warning/15 text-warning-foreground",
        )}
      >
        {value}
      </span>
    )
  }
  return <span className="text-sm font-medium">{value}</span>
}

/**
 * Collapsed-by-default "Integrity & identity" panel. Media (signed URLs) is
 * fetched only on first expand — never on initial page load. Renders a tab +
 * scrubber per media kind that actually exists, and a retention-deleted message
 * instead of a broken slider when recordings have been purged.
 */
export function EvidencePanel({
  testId,
  attemptId,
  availability,
  purgeDateLabel,
  retentionNote,
  facts,
}: {
  testId: string
  attemptId: string
  availability: "available" | "purged" | "none"
  purgeDateLabel: string | null
  retentionNote: string
  facts: Fact[]
}) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<ProctoringMediaView[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && availability === "available" && media === null && !loading) {
      setError(null)
      setLoading(true)
      loadProctoringMedia(testId, attemptId)
        .then((m) => setMedia(m))
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="size-4 text-muted-foreground" />
          Integrity &amp; identity
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {retentionNote}
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          {facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">{f.label}</dt>
                  <dd>
                    <FactValue value={f.value} tone={f.tone} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {availability === "purged" ? (
            <p className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-4 text-sm text-muted-foreground">
              <ImageOff className="size-4" />
              Recordings deleted per retention policy
              {purgeDateLabel ? ` on ${purgeDateLabel}` : ""}.
            </p>
          ) : availability === "none" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageOff className="size-4" />
              No proctoring media was captured for this attempt.
            </p>
          ) : loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading evidence…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : media ? (
            <MediaViewer media={media} />
          ) : null}
        </div>
      )}
    </div>
  )
}

/**
 * Non-timeline proctoring media for the integrity panel: the one-time identity
 * snapshot (standalone thumbnail) and, on higher tiers, the screen recording.
 * Camera frames are intentionally NOT scrubbed here — they live in the Session
 * playback card below, paired with the question on screen, so the report has a
 * single session scrubber.
 */
function MediaViewer({ media }: { media: ProctoringMediaView[] }) {
  const identity = media
    .filter((m) => m.kind === "face_match")
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const screen = media
    .filter((m) => m.kind === "screen")
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  if (identity.length === 0 && screen.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {identity.length > 0 && <IdentitySnapshot item={identity[0]} />}
      {screen.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Screen recording
          </span>
          <Scrubber items={screen} />
        </div>
      )}
    </div>
  )
}

/**
 * One-time identity-verification snapshot taken at session start. Rendered as a
 * standalone labelled thumbnail (not part of the session scrubber) because it
 * answers "is this the right person", not "where were they". Click to enlarge.
 */
function IdentitySnapshot({ item }: { item: ProctoringMediaView }) {
  const [zoomed, setZoomed] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        Identity check · verified at start
      </span>
      {item.url ? (
        <>
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="w-fit overflow-hidden rounded-lg border border-border bg-muted transition-opacity hover:opacity-90"
            aria-label="Enlarge identity snapshot"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt="Identity verification snapshot"
              className="h-32 w-auto object-contain"
            />
          </button>
          {zoomed && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Identity snapshot"
              onClick={() => setZoomed(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt="Identity verification snapshot"
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex h-32 w-fit min-w-[8rem] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted px-6 text-muted-foreground">
          <ImageOff className="size-5" />
          <span className="text-xs">No longer available.</span>
        </div>
      )}
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDateTime(item.created_at)}
      </span>
    </div>
  )
}

function Scrubber({ items }: { items: ProctoringMediaView[] }) {
  const [index, setIndex] = useState(0)
  const clamped = Math.min(index, items.length - 1)
  const current = items[clamped]

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        {current.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={`Snapshot ${clamped + 1}`}
            className="mx-auto max-h-[420px] w-full object-contain"
          />
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="size-6" />
            <span className="text-xs">This snapshot is no longer available.</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="size-8 shrink-0"
          disabled={clamped === 0}
          onClick={() => setIndex(clamped - 1)}
          aria-label="Previous snapshot"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <input
          type="range"
          min={0}
          max={items.length - 1}
          value={clamped}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="flex-1 accent-[var(--primary)]"
          aria-label="Scrub snapshots"
        />
        <Button
          size="icon"
          variant="outline"
          className="size-8 shrink-0"
          disabled={clamped === items.length - 1}
          onClick={() => setIndex(clamped + 1)}
          aria-label="Next snapshot"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground tabular-nums">
        {clamped + 1} of {items.length} · {formatDateTime(current.created_at)}
      </p>
    </div>
  )
}
