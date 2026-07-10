import { colors } from "@/lib/design-tokens"
import { brandedEmailLayout, escapeHtml } from "@/lib/notifications/email-layout"
import { appOrigin, sendTransactionalEmail } from "@/lib/notifications/send-email"

export async function sendCandidateInviteEmail(input: {
  to: string
  testTitle: string
  timeLimitMinutes: number
  token: string
  orgName?: string
}): Promise<{ ok: boolean; error?: string; configured: boolean }> {
  const assessmentUrl = `${appOrigin()}/t/${input.token}`
  const subject = `You're invited: ${input.testTitle}`
  const orgLine = input.orgName
    ? `<strong>${escapeHtml(input.orgName)}</strong> has invited you`
    : "You've been invited"

  const bodyHtml = `
    <p style="margin:0 0 16px;">${orgLine} to complete a timed skills assessment on Vertana.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;background:${colors.paper};border:1px solid ${colors.sageLine};border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:13px;color:${colors.inkMuted};">Assessment</p>
          <p style="margin:0;font-weight:600;">${escapeHtml(input.testTitle)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 18px 16px;">
          <p style="margin:0 0 6px;font-size:13px;color:${colors.inkMuted};">Time limit</p>
          <p style="margin:0;font-weight:600;">${input.timeLimitMinutes} minutes</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:${colors.inkMuted};font-size:14px;">
      This link is personal to <strong>${escapeHtml(input.to)}</strong>. Open it on a desktop
      with a stable connection when you're ready to begin.
    </p>`

  const html = brandedEmailLayout({
    preheader: `Complete ${input.testTitle} (${input.timeLimitMinutes} min)`,
    title: "Assessment invitation",
    bodyHtml,
    ctaLabel: "Start assessment",
    ctaUrl: assessmentUrl,
    footerHtml: `<p style="margin:0;color:${colors.inkMuted};font-size:13px;line-height:1.5;">
      If you weren't expecting this, you can ignore this email.
    </p>`,
  })

  const result = await sendTransactionalEmail({
    to: [input.to],
    subject,
    html,
    logLabel: "candidate invite",
  })

  return {
    ok: result.ok,
    error: result.ok ? undefined : result.error,
    configured: result.ok ? true : result.configured,
  }
}
