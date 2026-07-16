/**
 * Provider-agnostic ATS event model. The dispatch layer emits these; adapters
 * map them to a provider's shape *inside the adapter*, so this stays neutral.
 *
 * This module is intentionally dependency-free (pure types + a serializer) so it
 * can be imported by adapters and unit tests without pulling in server code.
 */

export type AtsEventType =
  | "attempt.submitted"
  | "score.finalized"
  | "disposition.changed"

export const ATS_EVENT_TYPES: AtsEventType[] = [
  "attempt.submitted",
  "score.finalized",
  "disposition.changed",
]

/** Normalized, PII-minimal payload. No proctoring media, no raw answers. */
export interface AtsEventPayload {
  orgId: string
  candidate: {
    id: string
    email: string
    name: string
  }
  assessment: {
    id: string
    title: string
  }
  /** Percentage 0–100, or null when not yet graded. */
  score: number | null
  /** Scores are percentages, so the ceiling is always 100. */
  maxScore: number
  /** Top-percent band if known, else null. */
  percentile: number | null
  disposition: string | null
  /** Recruiter-facing link back to the results page. */
  resultUrl: string
  occurredAt: string
}

export interface AtsEvent {
  /**
   * Stable, immutable identifier for this event, assigned once at creation and
   * preserved across queueing and retries. Used as the outbound idempotency key
   * so a receiver can deduplicate re-delivered events, and to enforce
   * uniqueness on (org_id, provider, event_id) in the delivery queue.
   */
  id: string
  type: AtsEventType
  payload: AtsEventPayload
}

/**
 * Canonical wire body for a delivered event. Kept deterministic (no wall-clock
 * inside) so signatures are reproducible and unit-testable — the timestamp lives
 * in `payload.occurredAt`.
 */
export function serializeAtsEvent(event: AtsEvent): string {
  return JSON.stringify({ id: event.id, event: event.type, data: event.payload })
}
