export type SendEmailResult =
  | { ok: true }
  | { ok: false; error: string; configured: boolean }

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
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[vertana] ${input.logLabel} (Brevo) failed:`, body)
    return { ok: false, error: body || "Brevo request failed", configured: true }
  }

  return { ok: true }
}
