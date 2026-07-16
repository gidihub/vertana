"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, Loader2, Monitor, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ProctoringSetupStep({
  token,
  attemptId,
  screenRecording = false,
  onComplete,
  onSkip,
}: {
  token: string
  attemptId: string
  /** When true, require the candidate to share their screen before starting. */
  screenRecording?: boolean
  onComplete: (screenStream?: MediaStream | null) => void
  onSkip: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<"identity" | "screen">("identity")
  const [sharing, setSharing] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    if (stage !== "identity") return
    let cancelled = false

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        if (cancelled) return
        setReady(true)
      } catch {
        if (cancelled) return
        setError(
          "Camera access is required for this proctored assessment. Enable camera permissions or use a supported browser.",
        )
      }
    }

    void initCamera()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [stopStream, stage])

  async function captureAndUpload() {
    const video = videoRef.current
    if (!video || uploading) return

    setUploading(true)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not capture camera frame")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Capture failed"))),
          "image/jpeg",
          0.85,
        )
      })

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("Read failed"))
        reader.readAsDataURL(blob)
      })

      const res = await fetch(`/api/candidate/${token}/proctoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          kind: "face_match",
          imageDataUrl: dataUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      stopStream()
      if (screenRecording) {
        setReady(false)
        setStage("screen")
      } else {
        onComplete()
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function shareScreenAndStart() {
    if (sharing) return
    setSharing(true)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5 } },
        audio: false,
      })
      // Hand the live display stream to the test runner (do NOT stop it here).
      onComplete(stream)
    } catch {
      toast.error(
        "Screen sharing is required for this assessment. Please share your entire screen to continue.",
      )
    } finally {
      setSharing(false)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Camera required</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter className="gap-2">
          <Button variant="outline" onClick={onSkip}>
            Go back
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (stage === "screen") {
    return (
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Monitor className="size-5" />
          </div>
          <CardTitle>Share your screen</CardTitle>
          <CardDescription>
            This assessment records your screen for integrity. Choose{" "}
            <strong>your entire screen</strong> when prompted. Screen sharing
            stops automatically when you submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
          <Monitor className="size-10 text-muted-foreground" />
          <p>Periodic screenshots are captured while you take the test.</p>
        </CardContent>
        <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Go back
          </Button>
          <Button
            type="button"
            disabled={sharing}
            onClick={() => void shareScreenAndStart()}
          >
            {sharing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Monitor className="size-4" />
            )}
            Share screen and start
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <CardTitle>Identity verification</CardTitle>
        <CardDescription>
          Take a one-time camera snapshot before the test starts. Periodic
          camera snapshots{screenRecording ? " and screen recording are" : " are"}{" "}
          captured during the assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl border border-border bg-muted">
          <video
            ref={videoRef}
            playsInline
            muted
            className="size-full object-cover"
          />
          {!ready ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Center your face in the frame, then continue.
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Go back
        </Button>
        <Button
          type="button"
          disabled={!ready || uploading}
          onClick={() => void captureAndUpload()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          Capture and continue
        </Button>
      </CardFooter>
    </Card>
  )
}
