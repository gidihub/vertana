"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  analyticsAllowed,
  COOKIE_PREFS_OPEN_EVENT,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentRecord,
} from "@/lib/cookie-consent"

const COOKIE_POLICY_HREF = "/legal/privacy#cookies-and-similar-technologies"

export function CookieConsentRoot() {
  const [consent, setConsent] = useState<CookieConsentRecord | null>(null)
  const [mounted, setMounted] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [analyticsOn, setAnalyticsOn] = useState(true)

  useEffect(() => {
    setMounted(true)
    const stored = readCookieConsent()
    setConsent(stored)
    setAnalyticsOn(stored?.analytics ?? true)
  }, [])

  useEffect(() => {
    const openPrefs = () => {
      const stored = readCookieConsent()
      setAnalyticsOn(stored?.analytics ?? true)
      setPrefsOpen(true)
    }
    window.addEventListener(COOKIE_PREFS_OPEN_EVENT, openPrefs)
    return () => window.removeEventListener(COOKIE_PREFS_OPEN_EVENT, openPrefs)
  }, [])

  const persist = useCallback((choice: "accepted" | "rejected", analytics: boolean) => {
    const record = writeCookieConsent(choice, analytics)
    setConsent(record)
    setAnalyticsOn(analytics)
    setPrefsOpen(false)
  }, [])

  if (!mounted) return null

  const showBanner = consent === null

  return (
    <>
      {process.env.NODE_ENV === "production" && analyticsAllowed(consent) ? (
        <Analytics />
      ) : null}

      {showBanner ? (
        <div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className="fixed bottom-6 left-6 z-50 w-[min(100vw-3rem,26rem)] rounded-2xl border border-sage-line/80 bg-surface p-6 shadow-[0_8px_30px_rgba(20,52,43,0.12)]"
        >
          <p id="cookie-consent-desc" className="text-sm leading-relaxed text-ink">
            We use cookies to enhance your experience. Visit our{" "}
            <Link
              href={COOKIE_POLICY_HREF}
              className="font-semibold text-pine underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              cookie policy
            </Link>{" "}
            to learn more and manage your{" "}
            <button
              type="button"
              id="cookie-consent-title"
              onClick={() => setPrefsOpen(true)}
              className="font-semibold text-pine underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              preferences
            </button>{" "}
            at any time.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button
              type="button"
              className="h-10 rounded-full bg-pine px-6 text-sm font-semibold text-pine-foreground hover:bg-pine-deep"
              onClick={() => persist("accepted", true)}
            >
              I accept
            </Button>
            <button
              type="button"
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
              onClick={() => persist("rejected", false)}
            >
              Reject all
            </button>
          </div>
        </div>
      ) : null}

      <CookiePreferencesDialog
        open={prefsOpen}
        analyticsOn={analyticsOn}
        onAnalyticsChange={setAnalyticsOn}
        onOpenChange={setPrefsOpen}
        onSave={() =>
          persist(analyticsOn ? "accepted" : "rejected", analyticsOn)
        }
      />
    </>
  )
}

function CookiePreferencesDialog({
  open,
  analyticsOn,
  onAnalyticsChange,
  onOpenChange,
  onSave,
}: {
  open: boolean
  analyticsOn: boolean
  onAnalyticsChange: (value: boolean) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cookie preferences</DialogTitle>
          <DialogDescription>
            Choose which optional cookies we may use. Strictly necessary cookies
            are always active so the site can function.{" "}
            <Link
              href={COOKIE_POLICY_HREF}
              className="font-medium text-pine underline-offset-2 hover:underline"
            >
              Read our cookie policy
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-4 py-2">
          <li className="flex items-start justify-between gap-4 rounded-lg border border-sage-line/70 bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium text-ink">Strictly necessary</p>
              <p className="mt-1 text-sm text-ink-muted">
                Authentication, security, and core session cookies required for
                Vertana to work.
              </p>
            </div>
            <Switch checked disabled aria-label="Strictly necessary cookies enabled" />
          </li>
          <li className="flex items-start justify-between gap-4 rounded-lg border border-sage-line/70 p-4">
            <div>
              <p className="text-sm font-medium text-ink">Analytics</p>
              <p className="mt-1 text-sm text-ink-muted">
                Help us understand usage and improve the product.
              </p>
            </div>
            <Switch
              checked={analyticsOn}
              onCheckedChange={onAnalyticsChange}
              aria-label="Analytics cookies"
            />
          </li>
        </ul>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave}>
            Save preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
