"use client"

import { analyticsAllowed } from "@/lib/cookie-consent"

type SolvabilityAnalyticsEvent =
  | "solvability_check_run"
  | "solvability_share_click"
  | "solvability_cta_click"
  | "solvability_email_submit"

export function trackSolvabilityEvent(
  name: SolvabilityAnalyticsEvent,
  data?: Record<string, string | number | boolean>,
): void {
  if (!analyticsAllowed()) return

  void import("@vercel/analytics").then(({ track }) => {
    track(name, data)
  })
}
