/**
 * "Comp" (complimentary / internal) organizations.
 *
 * An org whose OWNER signs up with an allowlisted email domain is comped: it
 * bypasses candidate-credit consumption and all paid-feature gates (proctoring,
 * active-test cap, AI-generation cap, certificates). This is an internal grant,
 * not a billing plan — it's orthogonal to `plan_tier`.
 *
 * Domains are configurable via the `VERTANA_COMP_DOMAINS` env var
 * (comma-separated); `mymdoc.com` is always included.
 */
const BUILT_IN_COMP_DOMAINS = ["mymdoc.com"]

export function compDomains(): string[] {
  const fromEnv = (process.env.VERTANA_COMP_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set([...BUILT_IN_COMP_DOMAINS, ...fromEnv])]
}

/** True if the email's domain is on the comp allowlist. */
export function isCompEmail(email: string | null | undefined): boolean {
  const domain = email?.split("@")[1]?.trim().toLowerCase()
  if (!domain) return false
  return compDomains().includes(domain)
}
