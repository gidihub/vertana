import type { Candidate, Test } from "@/lib/types"
import { colors } from "@/lib/design-tokens"
import { brandedEmailLayout, escapeHtml } from "@/lib/notifications/email-layout"
import { appOrigin, sendTransactionalEmail } from "@/lib/notifications/send-email"

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
  const bodyHtml = `
    <p style="margin:0 0 16px;">A candidate has submitted
    <strong>${escapeHtml(input.test.title)}</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${colors.paper};border:1px solid ${colors.sageLine};border-radius:12px;">
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid ${colors.sageLine};">
          <span style="font-size:13px;color:${colors.inkMuted};">Candidate</span><br />
          <strong>${escapeHtml(input.candidate.email)}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 18px;">
          <span style="font-size:13px;color:${colors.inkMuted};">Score</span><br />
          <strong>${escapeHtml(scoreLabel)}</strong>
        </td>
      </tr>
    </table>`

  const html = brandedEmailLayout({
    preheader: `${input.candidate.email} submitted ${input.test.title}`,
    title: "New submission",
    bodyHtml,
    ctaLabel: "View results",
    ctaUrl: resultsUrl,
  })

  await sendTransactionalEmail({
    to: recipients,
    subject,
    html,
    logLabel: "completion notification",
  })
}
