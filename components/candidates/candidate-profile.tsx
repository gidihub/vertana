"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  Clock,
  Copy,
  Download,
  ImageOff,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  loadCandidateProfile,
  type CandidateAttemptDetail,
  type CandidateProfileData,
  type ProctoringMediaView,
} from "@/lib/store"
import { candidateDisplayName, candidateInitials } from "@/lib/candidate-name"
import { evaluatePass } from "@/lib/passing"
import { hasIntegrityConcern } from "@/lib/integrity"
import { useStore } from "@/lib/store"
import { formatDateTime } from "@/lib/format"
import { numericText } from "@/lib/design-tokens"
import { parseCodingResponse } from "@/lib/coding/response"
import { languageLabel } from "@/lib/coding/languages"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CandidateStatusBadge,
  PassFailBadge,
} from "@/components/status-badge"
import { IntegrityConcernBadge } from "@/components/integrity-concern-badge"
import { CandidateDispositionSelect } from "@/components/candidates/candidate-disposition"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function formatDuration(
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) return "—"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return "—"
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}


export function CandidateProfile({ email }: { email: string }) {
  const [profile, setProfile] = useState<CandidateProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<ProctoringMediaView | null>(null)
  const [includeImages, setIncludeImages] = useState(true)
  const integrityThreshold = useStore(
    (db) => db.organization?.tab_switch_threshold ?? 3,
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadCandidateProfile(email)
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [email])

  const name = candidateDisplayName(email)

  const summary = useMemo(() => {
    if (!profile) return null
    const attempts = profile.attempts
    const scored = attempts.filter((a) => a.candidate.score !== null)
    const avg =
      scored.length > 0
        ? Math.round(
            scored.reduce((sum, a) => sum + (a.candidate.score ?? 0), 0) /
              scored.length,
          )
        : null
    const flagged = attempts.filter((a) =>
      hasIntegrityConcern(a.candidate.tab_switch_count, integrityThreshold),
    ).length
    const testIds = new Set(attempts.map((a) => a.test.id))
    return {
      assessments: testIds.size,
      completed: attempts.filter((a) => a.candidate.status === "submitted")
        .length,
      avg,
      flagged,
    }
  }, [profile, integrityThreshold])

  function downloadReport() {
    if (typeof window !== "undefined") window.print()
  }

  return (
    <div
      id="print-report"
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8",
        !includeImages && "print-no-media",
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground print:hidden"
        nativeButton={false}
        render={<Link href="/candidates" />}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to candidates
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
            {candidateInitials(email)}
          </span>
          <div className="flex min-w-0 flex-col">
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-ink">
              {name}
            </h1>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  .writeText(email)
                  .then(() => {
                    toast.success("Email copied")
                  })
                  .catch(() => {
                    toast.error("Couldn't copy email")
                  })
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {email}
              <Copy className="size-3.5 print:hidden" />
            </button>
          </div>
        </div>
        {profile && profile.attempts.length > 0 && (
          <div className="flex items-center gap-3 print:hidden">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={includeImages}
                onCheckedChange={setIncludeImages}
              />
              Include snapshots
            </label>
            <Button variant="outline" onClick={downloadReport}>
              <Download data-icon="inline-start" />
              Download report
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading candidate…
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : profile && summary ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Assessments", value: summary.assessments },
              { label: "Completed", value: summary.completed },
              {
                label: "Avg score",
                value: summary.avg === null ? "—" : `${summary.avg}%`,
              },
              { label: "Integrity flags", value: summary.flagged },
            ].map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={cn("text-2xl font-semibold", numericText)}>
                    {s.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {profile.attempts.map((attempt) => (
            <AttemptCard
              key={attempt.candidate.id}
              attempt={attempt}
              integrityThreshold={integrityThreshold}
              onOpenMedia={setLightbox}
            />
          ))}
        </>
      ) : null}

      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => !open && setLightbox(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Identity snapshot</DialogTitle>
          </DialogHeader>
          {lightbox?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.url}
              alt="Identity snapshot"
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              This snapshot is no longer available.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AttemptCard({
  attempt,
  integrityThreshold,
  onOpenMedia,
}: {
  attempt: CandidateAttemptDetail
  integrityThreshold: number
  onOpenMedia: (m: ProctoringMediaView) => void
}) {
  const { candidate, test, answers, consent, media } = attempt
  const passResult = evaluatePass(candidate.score, test.passing_score ?? 70)
  const integrity = hasIntegrityConcern(
    candidate.tab_switch_count,
    integrityThreshold,
  )

  return (
    <Card className="print-avoid-break">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex flex-wrap items-center gap-2">
              {test.title}
              <CandidateStatusBadge status={candidate.status} />
              {passResult && <PassFailBadge result={passResult} />}
            </CardTitle>
            <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDuration(candidate.started_at, candidate.submitted_at)}
              </span>
              <span>Submitted {formatDateTime(candidate.submitted_at)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-2xl font-semibold",
                numericText,
                candidate.score === null && "text-muted-foreground",
              )}
            >
              {candidate.score === null ? "—" : `${candidate.score}%`}
            </span>
            <span className="print:hidden">
              <CandidateDispositionSelect candidate={candidate} compact />
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <Detail label="Passing score">
            <span className={numericText}>{test.passing_score ?? 70}%</span>
          </Detail>
          <Detail label="Tab switches">
            <span className="flex items-center gap-1.5">
              {candidate.tab_switch_count}
              {integrity && <IntegrityConcernBadge compact />}
            </span>
          </Detail>
          <Detail label="Consent">
            {consent ? (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                {consent.accepted ? "Accepted" : "Declined"} (
                {consent.consent_version})
              </span>
            ) : (
              "Not proctored"
            )}
          </Detail>
        </div>

        {test.requires_proctoring && (
          <div className="print-media flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Camera className="size-4 text-muted-foreground" />
              Identity verification
            </span>
            {media.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {media.map((m) => (
                  <figure key={m.id} className="flex flex-col gap-1">
                    {m.url ? (
                      <button
                        type="button"
                        onClick={() => onOpenMedia(m)}
                        className="overflow-hidden rounded-lg border border-border transition hover:ring-2 hover:ring-primary"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt={`${m.kind} snapshot`}
                          className="h-28 w-28 object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted text-muted-foreground">
                        <ImageOff className="size-5" />
                        <span className="text-[10px]">Expired</span>
                      </div>
                    )}
                    <figcaption className="text-[10px] text-muted-foreground">
                      {m.kind === "face_match"
                        ? "Face verification"
                        : m.kind === "camera"
                          ? "Camera"
                          : "Screen"}{" "}
                      · {formatDateTime(m.created_at)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageOff className="size-3.5" />
                No camera snapshot captured for this attempt.
              </p>
            )}
          </div>
        )}

        {answers.length > 0 && (
          <div className="flex flex-col gap-2">
            <Separator />
            <span className="text-sm font-medium">Answers</span>
            <div className="flex flex-col gap-3">
              {answers.map((a, i) => (
                <AnswerView key={a.question_id} answer={a} index={i} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}

function AnswerView({
  answer: a,
  index: i,
}: {
  answer: CandidateAttemptDetail["answers"][number]
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const coding = a.type === "coding" ? parseCodingResponse(a.response) : null

  const correctness =
    a.is_correct === true
      ? { label: "Correct", cls: "text-chart-3" }
      : a.is_correct === false
        ? { label: "Incorrect", cls: "text-destructive" }
        : { label: "Needs review", cls: "text-muted-foreground" }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Q{i + 1} · {a.type.replace("_", " ")}
        </p>
        <span className={cn("text-xs font-medium", correctness.cls)}>
          {correctness.label}
          {a.points_awarded != null && (
            <span className="ml-1 font-normal text-muted-foreground">
              · {a.points_awarded}/{a.max_points} pts
            </span>
          )}
        </span>
      </div>
      <p className="mt-1 font-medium">{a.prompt}</p>

      {a.type === "coding" ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground print:hidden"
          >
            {expanded ? "Hide" : "Show"} submitted code
            {coding ? ` (${languageLabel(coding.language)})` : ""}
          </button>
          <pre
            className={cn(
              "mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap print:block print:max-h-none print:overflow-visible",
              !expanded && "hidden",
            )}
          >
            {coding?.code || "(no code)"}
          </pre>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
          {a.response || "(no answer)"}
        </p>
      )}
    </div>
  )
}
