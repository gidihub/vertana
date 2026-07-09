function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendTeamInviteEmail(input: {
  to: string
  orgName: string
  inviterEmail: string
  token: string
  role: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const acceptUrl = `${appOrigin()}/accept-invite/${input.token}`

  if (!apiKey) {
    console.log(
      "[vertana] team invite (email not configured):",
      input.to,
      "→",
      acceptUrl,
    )
    return false
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "Vertana <notifications@vertana.app>"

  const subject = `You've been invited to ${input.orgName} on Vertana`
  const html = `
    <p><strong>${escapeHtml(input.inviterEmail)}</strong> invited you to join
    <strong>${escapeHtml(input.orgName)}</strong> on Vertana as a
    <strong>${escapeHtml(input.role)}</strong>.</p>
    <p><a href="${acceptUrl}">Accept invitation</a></p>
    <p style="color:#666;font-size:13px;">This link expires in 7 days. Sign in with
    <strong>${escapeHtml(input.to)}</strong> to accept.</p>
  `

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    console.error("[vertana] team invite email failed:", await res.text())
    return false
  }

  return true
}
