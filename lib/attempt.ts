"use client"

// Tracks whether this browser has already completed a given test link, so a
// candidate returning to a finished assessment sees that it's recorded rather
// than a fresh attempt.
//
// TODO(supabase): replace with a lookup of candidates by (test_id, email) once
// attempts are persisted — e.g. supabase.from("candidates")
//   .select("id, submitted_at").eq("test_id", id).eq("email", email).maybeSingle()

const KEY_PREFIX = "vertana:submitted:"

export function markSubmitted(token: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY_PREFIX + token, new Date().toISOString())
  } catch {
    // Storage may be unavailable (private mode); non-fatal.
  }
}

export function getSubmittedAt(token: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(KEY_PREFIX + token)
  } catch {
    return null
  }
}
