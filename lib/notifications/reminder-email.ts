import { colors } from "@/lib/design-tokens"
import { brandedEmailLayout, escapeHtml } from "@/lib/notifications/email-layout"
import {
  appOrigin,
  firstNameFromEmail,
  sendTransactionalEmail,
} from "@/lib/notifications/send-email"

export type ReminderKind = "not_started" | "deadline"

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export async function sendCandidateReminderEmail(input: {
  kind: ReminderKind
  to: string
  testTitle: string
  timeLimitMinutes: number
  token: string
  orgName?: string
  replyTo?: string | null
  /** Deadline (ISO); shown to the candidate when present. */
  deadline?: string | null
}): Promise<{ ok: boolean; error?: string; configured: boolean }> {
  const assessmentUrl = `${appOrigin()}/t/${input.token}`
  const invitedBy = input.orgName
    ? `<strong>${escapeHtml(input.orgName)}</strong>`
    : "A hiring team"

  const isDeadline = input.kind === "deadline"

  const subject = isDeadline
    ? `Reminder: ${input.testTitle} closes soon`
    : `Reminder: complete ${input.testTitle}`

  const title = isDeadline ? "Your assessment closes soon" : "A quick reminder"

  const leadHtml = isDeadline
    ? `<p style="margin:0 0 16px;">${invitedBy} invited you to complete a timed skills assessment, and the deadline is approaching. There's still time to finish it.</p>`
    : `<p style="margin:0 0 16px;">${invitedBy} invited you to complete a timed skills assessment on Vertana. We noticed you haven't started yet — it only takes a few minutes to begin.</p>`

  const deadlineRow = input.deadline
    ? `
      <tr>
        <td style="padding:0 18px 16px;">
          <p style="margin:0 0 6px;font-size:13px;color:${colors.inkMuted};">Complete by</p>
          <p style="margin:0;font-weight:600;">${escapeHtml(
            formatDeadline(input.deadline),
          )}</p>
        </td>
      </tr>`
    : ""

  const firstName = firstNameFromEmail(input.to)
  const greetingHtml = `<p style="margin:0 0 16px;">Hello ${
    firstName ? escapeHtml(firstName) : "there"
  },</p>`

  const bodyHtml = `
    ${greetingHtml}
    ${leadHtml}
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
      ${deadlineRow}
    </table>
    <p style="margin:0;color:${colors.inkMuted};font-size:14px;">
      This link is personal to <strong>${escapeHtml(input.to)}</strong>. Open it on a desktop
      with a stable connection when you're ready to begin.
    </p>`

  const html = brandedEmailLayout({
    preheader: isDeadline
      ? `${input.testTitle} closes soon`
      : `Complete ${input.testTitle} (${input.timeLimitMinutes} min)`,
    title,
    bodyHtml,
    ctaLabel: isDeadline ? "Finish assessment" : "Start assessment",
    ctaUrl: assessmentUrl,
    footerHtml: `<p style="margin:0;color:${colors.inkMuted};font-size:13px;line-height:1.5;">
      If you've already completed this or weren't expecting it, you can ignore this email.
    </p>`,
  })

  const result = await sendTransactionalEmail({
    to: [input.to],
    subject,
    html,
    logLabel: `candidate reminder (${input.kind})`,
    replyTo: input.replyTo?.trim() || undefined,
  })

  return {
    ok: result.ok,
    error: result.ok ? undefined : result.error,
    configured: result.ok ? true : result.configured,
  }
}
