export type SendEmailResult =
  | { ok: true }
  | { ok: false; error: string; configured: boolean }

/**
 * Best-effort first name derived from an email local-part, e.g.
 * "pele.fasko@x.com" → "Pele", "jane_doe@x.com" → "Jane". Returns null when the
 * local-part isn't name-like (e.g. "info", "hr2024", single letters) so callers
 * can fall back to a neutral greeting.
 */
export function firstNameFromEmail(email: string): string | null {
  const local = (email.split("@")[0] ?? "").trim()
  if (!local) return null
  const token = local.split(/[.\-_+]/)[0] ?? ""
  const cleaned = token.replace(/[^a-zA-Z]/g, "")
  if (cleaned.length < 2) return null
  const generic = new Set([
    "info",
    "admin",
    "hr",
    "team",
    "hello",
    "contact",
    "recruiting",
    "recruitment",
    "careers",
    "jobs",
    "no",
    "noreply",
    "support",
  ])
  if (generic.has(cleaned.toLowerCase())) return null
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
}

export function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}

type SendEmailInput = {
  to: string[]
  subject: string
  html: string
  logLabel: string
  /** Optional Reply-To address so candidate replies reach the recruiter. */
  replyTo?: string
}

function brevoSender(): { name: string; email: string } {
  return {
    name: process.env.BREVO_FROM_NAME ?? "Vertana",
    email: process.env.BREVO_FROM_EMAIL ?? "notifications@vertana.app",
  }
}

/** Sends transactional email via Brevo. */
export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.log(
      `[vertana] ${input.logLabel} (email not configured):`,
      input.subject,
      `→ ${input.to.join(", ")}`,
    )
    return {
      ok: false,
      error: "BREVO_API_KEY not configured",
      configured: false,
    }
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: brevoSender(),
      to: input.to.map((email) => ({ email })),
      subject: input.subject,
      htmlContent: input.html,
      ...(input.replyTo ? { replyTo: { email: input.replyTo } } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[vertana] ${input.logLabel} (Brevo) failed:`, body)
    return { ok: false, error: body || "Brevo request failed", configured: true }
  }

  return { ok: true }
}
