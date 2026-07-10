import { colors } from "@/lib/design-tokens"
import { brandedEmailLayout, escapeHtml } from "@/lib/notifications/email-layout"
import { appOrigin, sendTransactionalEmail } from "@/lib/notifications/send-email"

export async function sendTeamInviteEmail(input: {
  to: string
  orgName: string
  inviterEmail: string
  token: string
  role: string
}): Promise<{ ok: boolean; error?: string; configured: boolean }> {
  const acceptUrl = `${appOrigin()}/accept-invite/${input.token}`
  const subject = `You've been invited to ${input.orgName} on Vertana`

  const bodyHtml = `
    <p style="margin:0 0 16px;">
      <strong>${escapeHtml(input.inviterEmail)}</strong> invited you to join
      <strong>${escapeHtml(input.orgName)}</strong> as a
      <strong>${escapeHtml(input.role)}</strong>.
    </p>
    <p style="margin:0;color:${colors.inkMuted};font-size:14px;">
      Sign in with <strong>${escapeHtml(input.to)}</strong> to accept. This link expires in 7 days.
    </p>`

  const html = brandedEmailLayout({
    preheader: `Join ${input.orgName} on Vertana`,
    title: "Team invitation",
    bodyHtml,
    ctaLabel: "Accept invitation",
    ctaUrl: acceptUrl,
  })

  const result = await sendTransactionalEmail({
    to: [input.to],
    subject,
    html,
    logLabel: "team invite",
  })

  return {
    ok: result.ok,
    error: result.ok ? undefined : result.error,
    configured: result.ok ? true : result.configured,
  }
}
