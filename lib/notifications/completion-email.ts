import type { Candidate, Test } from "@/lib/types"

function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}

async function sendEmail(input: {
  to: string[]
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(
      "[vertana] completion notification (email not configured):",
      input.subject,
      "→",
      input.to.join(", "),
    )
    return false
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "Vertana <notifications@vertana.app>"

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[vertana] completion notification failed:", body)
    return false
  }

  return true
}

export async function notifyTestCompletion(input: {
  test: Pick<Test, "id" | "title" | "notify_emails">
  candidate: Pick<Candidate, "email" | "score">
}): Promise<void> {
  const recipients = (input.test.notify_emails ?? []).filter(Boolean)
  if (!recipients.length) return

  const resultsUrl = `${appOrigin()}/tests/${input.test.id}/results`
  const scoreLabel =
    input.candidate.score === null ? "—" : `${input.candidate.score}%`

  const subject = `Candidate completed: ${input.test.title}`
  const html = `
    <p>A candidate has submitted <strong>${escapeHtml(input.test.title)}</strong>.</p>
    <ul>
      <li><strong>Candidate:</strong> ${escapeHtml(input.candidate.email)}</li>
      <li><strong>Score:</strong> ${escapeHtml(scoreLabel)}</li>
    </ul>
    <p><a href="${resultsUrl}">View results in Vertana</a></p>
  `

  await sendEmail({ to: recipients, subject, html })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
