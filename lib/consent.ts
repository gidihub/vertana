// ---------------------------------------------------------------------------
// PROCTORING CONSENT COPY
// ---------------------------------------------------------------------------
// Plain-language consent shown before proctored assessments. Bump CONSENT_VERSION
// whenever you change the wording so stored consent records stay auditable.
// ---------------------------------------------------------------------------

export const CONSENT_VERSION = "v2"

export const CONSENT_COPY = {
  title: "Before you begin: proctoring consent",
  intro:
    "This assessment uses lightweight integrity monitoring. Please read how your session is handled and confirm you agree before continuing.",

  points: [
    {
      heading: "What we monitor",
      body: "When you leave this browser tab or window during the test, we record a focus event. We do not capture your camera, microphone, or screen.",
    },
    {
      heading: "Why we monitor it",
      body: "To give the hiring team a fair signal about whether you stayed focused during the timed assessment.",
    },
    {
      heading: "Who reviews it",
      body: "Only the hiring team for this role. Events are not shared with anyone else.",
    },
    {
      heading: "How long we keep it",
      body: "Focus events are retained for 90 days with your submission, then permanently deleted.",
    },
  ],

  acceptLabel: "I consent and want to continue",
  declineLabel: "I don't consent",
}

export const CONSENT_DECLINED_MESSAGE =
  "This assessment requires proctoring consent to continue. Because you didn't consent, we can't proceed. If you believe this is a mistake or have questions, please contact the hiring team that sent you this link."

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
