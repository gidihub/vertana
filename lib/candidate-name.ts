/**
 * Best-effort human display name derived from a candidate email local-part.
 * "pele.fasko@x.com" → "Pele Fasko", "jane_doe@x.com" → "Jane Doe".
 * Falls back to the full email when the local-part isn't name-like.
 */
export function candidateDisplayName(email: string): string {
  const local = (email.split("@")[0] ?? "").trim()
  if (!local) return email

  const parts = local
    .split(/[.\-_+]/)
    .map((token) => token.replace(/[^a-zA-Z]/g, ""))
    .filter((token) => token.length >= 2)

  if (parts.length === 0) return email

  return parts
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ")
}

/** 1-2 letter initials for an avatar, derived from the display name or email. */
export function candidateInitials(email: string): string {
  const name = candidateDisplayName(email)
  if (name === email) {
    return email.slice(0, 2).toUpperCase()
  }
  const words = name.split(" ").filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
