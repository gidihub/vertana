"use client"

import { useEffect, useRef } from "react"

/**
 * Silent, consent-gated proctoring monitor. Keeps the candidate's camera stream
 * open for the duration of a proctored test and uploads a still snapshot each
 * time the candidate settles on a question (kind: "camera", tagged with the
 * question id). Renders a hidden video element; there is no visible UI. Capture
 * stops automatically on unmount (submit/leave) and the server rejects uploads
 * once the attempt is submitted.
 *
 * Candidates already grant camera permission during the identity step, so this
 * reopens the stream without a second prompt. If the stream can't be opened
 * (permission revoked, no device), it fails silently — tab-focus monitoring and
 * the start snapshot still stand.
 */
// A short dwell before capturing avoids burning the per-plan snapshot cap when
// a candidate quickly pages through questions without stopping to answer.
const DWELL_MS = 1_500
const DEFAULT_MAX_SNAPSHOTS = 30

export function ProctoringMonitor({
  token,
  attemptId,
  questionId,
  questionIndex,
  maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
}: {
  token: string
  attemptId: string
  questionId: string
  questionIndex: number
  maxSnapshots?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const uploadingRef = useRef(false)
  const countRef = useRef(0)
  // Question ids already captured this attempt — one snapshot per question.
  const capturedRef = useRef<Set<string>>(new Set())

  // Open the camera stream once for the lifetime of the monitor.
  useEffect(() => {
    if (maxSnapshots <= 0) return
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch {
        // No camera access — monitoring simply doesn't run.
      }
    }

    void start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [maxSnapshots])

  // Capture one snapshot per question, after the candidate dwells on it.
  useEffect(() => {
    if (maxSnapshots <= 0 || !questionId) return
    if (capturedRef.current.has(questionId)) return

    let cancelled = false

    async function capture() {
      const video = videoRef.current
      const stream = streamRef.current
      if (!video || !stream) return
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

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
        const res = await fetch(`/api/candidate/${token}/proctoring`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            kind: "camera",
            imageDataUrl: dataUrl,
            questionId,
            questionIndex,
          }),
        })
        // Mark captured on success regardless of whether this effect has since
        // been cancelled — the upload succeeded, so the question must not be
        // re-captured on a later revisit.
        if (res.ok) {
          countRef.current += 1
          capturedRef.current.add(questionId)
        }
      } catch {
        // Silent: a failed periodic snapshot must never disrupt the candidate.
      } finally {
        uploadingRef.current = false
      }
    }

    // Retry briefly so the first capture waits for the stream to warm up, and so
    // a question whose turn coincides with an in-flight upload is retried once
    // that upload finishes rather than being silently dropped.
    const dwell = setTimeout(function attempt() {
      if (cancelled) return
      if (capturedRef.current.has(questionId)) return
      const video = videoRef.current
      if (!streamRef.current || !video || video.videoWidth === 0) {
        retry = setTimeout(attempt, 400)
        return
      }
      if (uploadingRef.current) {
        retry = setTimeout(attempt, 400)
        return
      }
      void capture()
    }, DWELL_MS)
    let retry: ReturnType<typeof setTimeout> | null = null

    return () => {
      cancelled = true
      clearTimeout(dwell)
      if (retry) clearTimeout(retry)
    }
  }, [token, attemptId, questionId, questionIndex, maxSnapshots])

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      aria-hidden
      className="pointer-events-none fixed -z-10 size-px opacity-0"
    />
  )
}
