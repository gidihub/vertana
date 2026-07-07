"use client"

import { use } from "react"
import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { useStore } from "@/lib/store"
import { CertificateView } from "@/components/certificate/certificate-view"

export default function CertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const certificate = useStore((db) =>
    db.certificates.find((c) => c.slug === slug),
  )

  const isAvailable = certificate && !certificate.revoked

  return (
    <main className="min-h-svh bg-sage/40">
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center px-4 py-16">
        {isAvailable ? (
          <CertificateView certificate={certificate} />
        ) : (
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-paper text-ink-muted">
              <FileQuestion className="size-7" aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-balance text-ink">
              Certificate not available
            </h1>
            <p className="text-pretty text-ink-muted">
              This certificate doesn&apos;t exist or has been removed by the
              person it was issued to.
            </p>
            <Link
              href="/"
              className="rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-pine-foreground transition-colors hover:bg-pine-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Go to Vertana
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
