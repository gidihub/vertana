"use client"

import { useEffect, useRef } from "react"

/**
 * Silent, consent-gated proctoring monitor. Keeps the candidate's camera stream
 * open for the duration of a proctored test and uploads a still snapshot at a
 * fixed interval (kind: "camera"). Renders a hidden video element; there is no
 * visible UI. Capture stops automatically on unmount (submit/leave) and the
 * server rejects uploads once the attempt is submitted.
 *
 * Candidates already grant camera permission during the identity step, so this
 * reopens the stream without a second prompt. If the stream can't be opened
 * (permission revoked, no device), it fails silently — tab-focus monitoring and
 * the start snapshot still stand.
 */
// Conservative fallbacks if a plan policy isn't supplied. The org's plan tier
// normally drives cadence/cap (see proctoringPolicyForTier). The start identity
// snapshot is captured separately.
const DEFAULT_INTERVAL_MS = 60_000
const DEFAULT_MAX_SNAPSHOTS = 30

export function ProctoringMonitor({
  token,
  attemptId,
  intervalMs = DEFAULT_INTERVAL_MS,
  maxSnapshots = DEFAULT_MAX_SNAPSHOTS,
}: {
  token: string
  attemptId: string
  intervalMs?: number
  maxSnapshots?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const uploadingRef = useRef(false)
  const countRef = useRef(0)

  useEffect(() => {
    if (maxSnapshots <= 0) return
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function capture() {
      const video = videoRef.current
      const stream = streamRef.current
      if (!video || !stream || uploadingRef.current) return
      if (video.videoWidth === 0 || video.videoHeight === 0) return
      if (countRef.current >= maxSnapshots) {
        if (intervalId) clearInterval(intervalId)
        return
      }

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
          }),
        })
        if (res.ok) countRef.current += 1
      } catch {
        // Silent: a failed periodic snapshot must never disrupt the candidate.
      } finally {
        uploadingRef.current = false
      }
    }

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
        intervalId = setInterval(() => void capture(), intervalMs)
      } catch {
        // No camera access — monitoring simply doesn't run.
      }
    }

    void start()

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [token, attemptId, intervalMs, maxSnapshots])

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
