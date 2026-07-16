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

const KIND_LABELS: Record<ProctoringMediaView["kind"], string> = {
  camera: "Camera",
  screen: "Screen",
  face_match: "Identity",
}
const KIND_ORDER: ProctoringMediaView["kind"][] = ["camera", "screen", "face_match"]

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

function MediaViewer({ media }: { media: ProctoringMediaView[] }) {
  const byKind = KIND_ORDER.map((kind) => ({
    kind,
    items: media
      .filter((m) => m.kind === kind)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  })).filter((g) => g.items.length > 0)

  const camera = byKind.find((g) => g.kind === "camera")?.items ?? []
  const screen = byKind.find((g) => g.kind === "screen")?.items ?? []
  const identity = byKind.find((g) => g.kind === "face_match")?.items ?? []

  if (byKind.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageOff className="size-4" />
        No proctoring media was captured for this attempt.
      </p>
    )
  }

  // When both camera and screen exist, show the competitor-style side-by-side
  // viewer with time-synced scrubbing across both feeds.
  if (camera.length > 0 && screen.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <SyncedSideBySide camera={camera} screen={screen} />
        {identity.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {KIND_LABELS.face_match} verification
            </span>
            <Scrubber items={identity} />
          </div>
        )}
      </div>
    )
  }

  return <EvidenceTabs byKind={byKind} />
}

function EvidenceTabs({
  byKind,
}: {
  byKind: { kind: ProctoringMediaView["kind"]; items: ProctoringMediaView[] }[]
}) {
  const [activeKind, setActiveKind] = useState(byKind[0]?.kind)
  const active = byKind.find((g) => g.kind === activeKind) ?? byKind[0]

  return (
    <div className="flex flex-col gap-3">
      {byKind.length > 1 && (
        <div className="flex gap-1.5">
          {byKind.map((g) => (
            <button
              key={g.kind}
              type="button"
              onClick={() => setActiveKind(g.kind)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                g.kind === active.kind
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {KIND_LABELS[g.kind]} ({g.items.length})
            </button>
          ))}
        </div>
      )}
      <Scrubber key={active.kind} items={active.items} />
    </div>
  )
}

/**
 * Returns the item whose timestamp is the latest at or before `t`, or
 * `undefined` when `t` precedes the feed's first capture — so a feed never
 * shows a future frame alongside earlier evidence from the other feed.
 */
function frameAtTime(
  items: ProctoringMediaView[],
  t: number,
): ProctoringMediaView | undefined {
  let chosen: ProctoringMediaView | undefined
  for (const item of items) {
    if (new Date(item.created_at).getTime() <= t) chosen = item
    else break
  }
  return chosen
}

function SyncedSideBySide({
  camera,
  screen,
}: {
  camera: ProctoringMediaView[]
  screen: ProctoringMediaView[]
}) {
  // Master timeline = every capture time across both feeds, de-duplicated.
  const timeline = Array.from(
    new Set([...camera, ...screen].map((m) => new Date(m.created_at).getTime())),
  ).sort((a, b) => a - b)

  const [index, setIndex] = useState(0)
  const clamped = Math.min(index, timeline.length - 1)
  const t = timeline[clamped]
  const cam = frameAtTime(camera, t)
  const scr = frameAtTime(screen, t)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <MediaPane label={`${KIND_LABELS.camera}`} item={cam} />
        <MediaPane label={`${KIND_LABELS.screen}`} item={scr} />
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="size-8 shrink-0"
          disabled={clamped === 0}
          onClick={() => setIndex(clamped - 1)}
          aria-label="Previous frame"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <input
          type="range"
          min={0}
          max={timeline.length - 1}
          value={clamped}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="flex-1 accent-[var(--primary)]"
          aria-label="Scrub camera and screen together"
        />
        <Button
          size="icon"
          variant="outline"
          className="size-8 shrink-0"
          disabled={clamped === timeline.length - 1}
          onClick={() => setIndex(clamped + 1)}
          aria-label="Next frame"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground tabular-nums">
        {clamped + 1} of {timeline.length} · {formatDateTime(new Date(t).toISOString())}
      </p>
    </div>
  )
}

function MediaPane({
  label,
  item,
}: {
  label: string
  item: ProctoringMediaView | undefined
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        {item?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={label}
            className="mx-auto max-h-[320px] w-full object-contain"
          />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="size-6" />
            <span className="text-xs">Not available.</span>
          </div>
        )}
      </div>
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
