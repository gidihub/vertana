"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Screen-recording sibling of ProctoringMonitor. Receives an already-granted
 * display-capture stream (acquired during the proctoring setup step, which is a
 * user gesture) and uploads a still screenshot each time the candidate settles
 * on a question (kind: "screen", tagged with the question id). Renders a hidden
 * video element; there is no visible UI. The stream is stopped on unmount
 * (submit/leave) and the server rejects uploads once the attempt is submitted.
 *
 * If the candidate stops sharing mid-test (the video track ends), capture is
 * halted and a blocking overlay requires them to restore screen sharing before
 * the assessment can continue.
 */
const DWELL_MS = 1_500
const DEFAULT_MAX_SNAPSHOTS = 30

export function ScreenMonitor({
  token,
  attemptId,
  questionId,
  questionIndex,
  stream,
  maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
}: {
  token: string
  attemptId: string
  questionId: string
  questionIndex: number
  stream: MediaStream | null
  maxSnapshots?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const uploadingRef = useRef(false)
  const countRef = useRef(0)
  const capturedRef = useRef<Set<string>>(new Set())
  const endedRef = useRef(false)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(stream)
  const [ended, setEnded] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Adopt a freshly-provided stream (e.g. after a resume re-runs setup).
  useEffect(() => {
    setActiveStream(stream)
    endedRef.current = false
    setEnded(false)
  }, [stream])

  // Attach the active display stream and watch for the candidate ending the
  // share. Stop its tracks (and remove the listener) when the monitor unmounts
  // or the stream is replaced so screen sharing ends when the test does.
  useEffect(() => {
    if (!activeStream) return
    const video = videoRef.current
    if (video) {
      video.srcObject = activeStream
      void video.play().catch(() => {})
    }
    const track = activeStream.getVideoTracks()[0]
    const onEnded = () => {
      endedRef.current = true
      setEnded(true)
    }
    track?.addEventListener("ended", onEnded)
    return () => {
      track?.removeEventListener("ended", onEnded)
      activeStream.getTracks().forEach((t) => t.stop())
    }
  }, [activeStream])

  useEffect(() => {
    if (!activeStream || ended || maxSnapshots <= 0 || !questionId) return
    if (capturedRef.current.has(questionId)) return

    let cancelled = false

    async function capture() {
      const video = videoRef.current
      if (!video || endedRef.current) return
      if (video.videoWidth === 0 || video.videoHeight === 0) return
      if (countRef.current >= maxSnapshots) return
      if (capturedRef.current.has(questionId)) return

      uploadingRef.current = true
      try {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL("image/jpeg", 0.6)
        const res = await fetch(`/api/candidate/${token}/proctoring`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            kind: "screen",
            imageDataUrl: dataUrl,
            questionId,
            questionIndex,
          }),
        })
        if (res.ok) {
          countRef.current += 1
          capturedRef.current.add(questionId)
        }
      } catch {
        // Silent: a failed screenshot must never disrupt the candidate.
      } finally {
        uploadingRef.current = false
      }
    }

    let retry: ReturnType<typeof setTimeout> | null = null
    const dwell = setTimeout(function attempt() {
      if (cancelled || endedRef.current) return
      if (capturedRef.current.has(questionId)) return
      const video = videoRef.current
      if (!video || video.videoWidth === 0) {
        retry = setTimeout(attempt, 400)
        return
      }
      if (uploadingRef.current) {
        retry = setTimeout(attempt, 400)
        return
      }
      void capture()
    }, DWELL_MS)

    return () => {
      cancelled = true
      clearTimeout(dwell)
      if (retry) clearTimeout(retry)
    }
  }, [token, attemptId, questionId, questionIndex, activeStream, ended, maxSnapshots])

  const restoreSharing = useCallback(async () => {
    if (restoring) return
    setRestoring(true)
    try {
      const next = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5 } },
        audio: false,
      })
      endedRef.current = false
      setActiveStream(next)
      setEnded(false)
    } catch {
      // Stay blocked until the candidate successfully re-shares.
    } finally {
      setRestoring(false)
    }
  }, [restoring])

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        aria-hidden
        className="pointer-events-none fixed -z-10 size-px opacity-0"
      />
      {ended && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur"
        >
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Monitor className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold">Screen sharing stopped</p>
              <p className="text-sm text-muted-foreground">
                This assessment requires screen sharing. Restore it to continue
                — choose <strong>your entire screen</strong> when prompted.
              </p>
            </div>
            <Button
              type="button"
              disabled={restoring}
              onClick={() => void restoreSharing()}
            >
              {restoring ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Monitor className="size-4" />
              )}
              Resume screen sharing
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
