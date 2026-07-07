// ---------------------------------------------------------------------------
// PROCTORING CONSENT COPY
// ---------------------------------------------------------------------------
// This is the plain-language consent shown to candidates before any camera or
// microphone permission is requested. Edit the text freely — bump CONSENT_VERSION
// whenever you change the wording so the stored consent records stay auditable.
// ---------------------------------------------------------------------------

export const CONSENT_VERSION = "v1"

export const CONSENT_COPY = {
  title: "Before you begin: proctoring consent",
  intro:
    "This assessment is proctored. Please read how your data is handled and confirm you agree before continuing.",

  // Each bullet has a short heading and a plain-language explanation.
  points: [
    {
      heading: "What we capture",
      body: "Your camera feed, a recording of your screen during the assessment, and a one-time face verification snapshot.",
    },
    {
      heading: "Why we capture it",
      body: "To verify your identity and to detect irregularities during the assessment.",
    },
    {
      heading: "Who reviews it",
      body: "Only the hiring team for this role. It is not shared with anyone else.",
    },
    {
      heading: "How long we keep it",
      body: "Recordings and snapshots are retained for 90 days, then permanently deleted.",
    },
  ],

  acceptLabel: "I consent and want to continue",
  declineLabel: "I don't consent",
}

// Shown after a candidate declines. Easy to edit.
export const CONSENT_DECLINED_MESSAGE =
  "This assessment requires proctoring to continue. Because you didn't consent, we can't proceed. If you believe this is a mistake or have questions, please contact the hiring team that sent you this link."

// A flat text snapshot of exactly what the candidate saw, stored on the
// consent record so you always know what wording was agreed to.
export function buildConsentSnapshot(): string {
  const lines = [
    CONSENT_COPY.title,
    "",
    CONSENT_COPY.intro,
    "",
    ...CONSENT_COPY.points.map((p) => `- ${p.heading}: ${p.body}`),
  ]
  return lines.join("\n")
}
