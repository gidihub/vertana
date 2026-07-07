"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { FileQuestion, Loader2 } from "lucide-react"

import { CandidateHeader } from "@/components/candidate/candidate-header"
import { fetchCertificateBySlug } from "@/lib/store"
import type { Certificate } from "@/lib/types"
import { CertificateView } from "@/components/certificate/certificate-view"
import { appShell } from "@/lib/design-tokens"

export default function CertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchCertificateBySlug(slug).then((cert) => {
      setCertificate(cert)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <div className={appShell}>
        <CandidateHeader />
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-pine" />
        </div>
      </div>
    )
  }

  const isAvailable = certificate && !certificate.revoked

  return (
    <div className={appShell}>
      <CandidateHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16">
        {isAvailable ? (
          <CertificateView certificate={certificate} />
        ) : (
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-sage text-ink-muted">
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
      </main>
    </div>
  )
}
