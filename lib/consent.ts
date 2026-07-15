// ---------------------------------------------------------------------------
// PROCTORING CONSENT COPY
// ---------------------------------------------------------------------------
// Plain-language consent shown before proctored assessments. Bump CONSENT_VERSION
// whenever you change the wording so stored consent records stay auditable.
// ---------------------------------------------------------------------------

import {
  isCameraProctoringEnabled,
  isCameraProctoringEnabledClient,
} from "@/lib/proctoring/config"

export const CONSENT_VERSION_TAB = "v3"
export const CONSENT_VERSION_CAMERA = "v5"
/** Legacy camera consent (single start snapshot) kept for auditing old records. */
export const CONSENT_VERSION_CAMERA_LEGACY = "v4"

export type ConsentCopy = {
  version: string
  title: string
  intro: string
  points: { heading: string; body: string }[]
  acceptLabel: string
  declineLabel: string
  checkboxLabel: string
}

const CONSENT_COPY_TAB: ConsentCopy = {
  version: CONSENT_VERSION_TAB,
  title: "Before you begin: integrity monitoring consent",
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
  checkboxLabel:
    "I have read the above and I consent to tab-focus integrity monitoring for this assessment.",
}

const CONSENT_COPY_CAMERA: ConsentCopy = {
  version: CONSENT_VERSION_CAMERA,
  title: "Before you begin: proctoring consent",
  intro:
    "This proctored assessment uses tab-focus monitoring and periodic camera snapshots. Please read the details below before continuing.",
  points: [
    {
      heading: "What we capture",
      body: "A camera snapshot at the start to verify your identity, plus periodic still snapshots at regular intervals while you take the test, and tab-focus events if you leave the assessment window. We do not record continuous video, audio, or your screen.",
    },
    {
      heading: "Why we capture it",
      body: "To verify identity and give the hiring team a fair integrity signal during the timed assessment.",
    },
    {
      heading: "Who reviews it",
      body: "Only the hiring team for this role. Media is not shared with anyone else.",
    },
    {
      heading: "How long we keep it",
      body: "Snapshots and focus events are retained for 90 days with your submission, then permanently deleted.",
    },
  ],
  acceptLabel: "I consent and want to continue",
  declineLabel: "I don't consent",
  checkboxLabel:
    "I have read the above and I consent to the periodic camera snapshots and integrity monitoring described.",
}

// Legacy single-snapshot copy (v4). Kept only so old consent records still
// resolve for auditing; never shown to new candidates.
const CONSENT_COPY_CAMERA_LEGACY: ConsentCopy = {
  version: CONSENT_VERSION_CAMERA_LEGACY,
  title: "Before you begin: proctoring consent",
  intro:
    "This proctored assessment uses tab-focus monitoring and a one-time camera snapshot for identity verification. Please read the details below before continuing.",
  points: [
    {
      heading: "What we capture",
      body: "A single camera snapshot at the start of the test, plus tab-focus events if you leave the assessment window. We do not record continuous video or your screen.",
    },
    {
      heading: "Why we capture it",
      body: "To verify identity and give the hiring team a fair integrity signal during the timed assessment.",
    },
    {
      heading: "Who reviews it",
      body: "Only the hiring team for this role. Media is not shared with anyone else.",
    },
    {
      heading: "How long we keep it",
      body: "Snapshots and focus events are retained for 90 days with your submission, then permanently deleted.",
    },
  ],
  acceptLabel: "I consent and want to continue",
  declineLabel: "I don't consent",
  checkboxLabel:
    "I have read the above and I consent to the camera snapshot and integrity monitoring described.",
}

/** @deprecated Use getConsentCopy() */
export const CONSENT_COPY = CONSENT_COPY_TAB

export function getConsentCopy(): ConsentCopy {
  return isCameraProctoringEnabledClient()
    ? CONSENT_COPY_CAMERA
    : CONSENT_COPY_TAB
}

/** Server-side: canonical version for the active proctoring mode. */
export function activeConsentVersion(): string {
  return isCameraProctoringEnabled()
    ? CONSENT_VERSION_CAMERA
    : CONSENT_VERSION_TAB
}

export function consentCopyForVersion(version: string): ConsentCopy {
  if (version === CONSENT_VERSION_TAB) return CONSENT_COPY_TAB
  if (version === CONSENT_VERSION_CAMERA) return CONSENT_COPY_CAMERA
  if (version === CONSENT_VERSION_CAMERA_LEGACY) return CONSENT_COPY_CAMERA_LEGACY
  throw new Error("Unsupported consent version")
}

export const CONSENT_DECLINED_MESSAGE =
  "This assessment requires proctoring consent to continue. Because you didn't consent, we can't proceed. If you believe this is a mistake or have questions, please contact the hiring team that sent you this link."

export function buildConsentSnapshot(copy = getConsentCopy()): string {
  const lines = [
    copy.title,
    "",
    copy.intro,
    "",
    ...copy.points.map((p) => `- ${p.heading}: ${p.body}`),
  ]
  return lines.join("\n")
}
