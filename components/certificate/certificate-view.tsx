"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { SquareCheckBig, BadgeCheck, Link2, Code2, Trash2 } from "lucide-react"

import type { Certificate } from "@/lib/types"
import { revokeCertificate } from "@/lib/store"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"

export function CertificateView({ certificate }: { certificate: Certificate }) {
  const [removing, setRemoving] = useState(false)
  // Resolved after mount so SSR and the first client render agree (avoids a
  // hydration mismatch on the share URLs).
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const publicUrl = `${origin}/certificate/${certificate.slug}`

  const embedSnippet = `<a href="${publicUrl}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid #cbd2c3;border-radius:9999px;font-family:sans-serif;font-size:14px;color:#18231d;text-decoration:none;background:#f2f3ef">Vertana · ${certificate.skill_name} · ${certificate.percentile_band}</a>`

  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
    `${certificate.skill_name} — ${certificate.percentile_band}`,
  )}&organizationName=Vertana&certUrl=${encodeURIComponent(publicUrl)}`

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
    } catch {
      toast.error("Could not copy to clipboard")
    }
  }

  function handleRemoval() {
    revokeCertificate(certificate.slug)
    setRemoving(false)
    toast.success("Removal requested. This certificate is no longer public.")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
      {/* Certificate card */}
      <div className="w-full overflow-hidden rounded-2xl border border-sage-line bg-paper shadow-sm">
        <div className="h-2 bg-pine" />
        <div className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-pine text-pine-foreground">
              <SquareCheckBig className="size-4.5" aria-hidden />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Vertana
            </span>
          </div>

          <p className="text-xs font-medium tracking-[0.2em] text-ink-muted uppercase">
            Certificate of performance
          </p>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted">This certifies that</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              {certificate.candidate_name}
            </h1>
          </div>

          <p className="max-w-md text-base leading-relaxed text-pretty text-ink">
            has demonstrated strong performance in{" "}
            <span className="font-semibold">{certificate.skill_name}</span>
          </p>

          <div className="inline-flex items-center gap-2 rounded-full bg-pine px-5 py-2 text-pine-foreground">
            <BadgeCheck className="size-4" aria-hidden />
            <span className="text-sm font-semibold">
              {certificate.percentile_band}
            </span>
          </div>

          <div className="mt-2 flex w-full items-center justify-center gap-3 border-t border-sage-line/70 pt-6 text-sm text-ink-muted">
            <span>Issued {formatDate(certificate.issued_at)}</span>
            <span aria-hidden>·</span>
            <span>Verified by Vertana</span>
          </div>
        </div>
      </div>

      {/* Share options */}
      <div className="flex w-full flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            variant="outline"
            onClick={() => copy(publicUrl, "Public link copied")}
          >
            <Link2 data-icon="inline-start" />
            Copy link
          </Button>
          <Button
            variant="outline"
            onClick={() => copy(embedSnippet, "Embed snippet copied")}
          >
            <Code2 data-icon="inline-start" />
            Copy embed
          </Button>
          <Button
            nativeButton={false}
            render={
              <a href={linkedInUrl} target="_blank" rel="noreferrer" />
            }
          >
            <Image
              src="/brand/linkedin.svg"
              alt=""
              width={16}
              height={16}
              className="size-4 brightness-0 invert"
              data-icon="inline-start"
              aria-hidden
            />
            Add to LinkedIn
          </Button>
        </div>
      </div>

      {/* Removal */}
      <div className="text-center">
        {removing ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-sage-line bg-paper p-4">
            <p className="text-sm text-ink text-pretty">
              Remove this certificate? Its public link will stop working.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoving(false)}
              >
                Keep it
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoval}
              >
                <Trash2 data-icon="inline-start" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRemoving(true)}
            className="rounded text-sm text-ink-muted underline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Request removal
          </button>
        )}
      </div>

      <Link
        href="/"
        className="rounded text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        What is Vertana?
      </Link>
    </div>
  )
}
