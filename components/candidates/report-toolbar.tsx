"use client"

import { useEffect, useState } from "react"
import { Copy, Download } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format"

/**
 * Renders a timestamp in the viewer's local timezone without a hydration
 * mismatch. `toLocaleString` is timezone-dependent, so the initial render uses
 * a fixed UTC format (identical on server and client), then swaps to the
 * browser's local time after mount.
 */
function formatUtc(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

export function LocalDateTime({ iso }: { iso: string | null }) {
  const [text, setText] = useState(() => formatUtc(iso))
  useEffect(() => {
    setText(formatDateTime(iso))
  }, [iso])
  return <span suppressHydrationWarning>{text}</span>
}

/**
 * Small client island for the report's identity header: copy the candidate's
 * email and trigger a printable report. Everything else in the header is static
 * server-rendered content.
 */
export function ReportEmailButton({ email }: { email: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(email)
          .then(() => toast.success("Email copied"))
          .catch(() => toast.error("Couldn't copy email"))
      }}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      {email}
      <Copy className="size-3.5 print:hidden" />
    </button>
  )
}

export function ReportPrintButton() {
  return (
    <Button
      variant="outline"
      className="print:hidden"
      onClick={() => {
        if (typeof window !== "undefined") window.print()
      }}
    >
      <Download data-icon="inline-start" />
      Download report
    </Button>
  )
}
