import { colors } from "@/lib/design-tokens"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function brandedEmailLayout(input: {
  preheader?: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerHtml?: string
}): string {
  const preheader = input.preheader
    ? `<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(input.preheader)}</span>`
    : ""

  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<p style="margin:28px 0 0;">
          <a href="${input.ctaUrl}"
             style="display:inline-block;background:${colors.pine};color:${colors.pineForeground};font-weight:600;text-decoration:none;padding:12px 24px;border-radius:999px;">
            ${escapeHtml(input.ctaLabel)}
          </a>
        </p>`
      : ""

  const footer =
    input.footerHtml ??
    `<p style="margin:0;color:${colors.inkMuted};font-size:13px;line-height:1.5;">
       Sent by Vertana · skills assessments for hiring teams
     </p>`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${colors.paper};font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:${colors.ink};">
    ${preheader}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.paper};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${colors.card};border:1px solid ${colors.sageLine};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${colors.pine};padding:20px 28px;">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${colors.lime};">Vertana</p>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;line-height:1.3;color:${colors.pineForeground};">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.6;color:${colors.ink};">
                ${input.bodyHtml}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;border-top:1px solid ${colors.sageLine};">
                <div style="padding-top:20px;">${footer}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export { escapeHtml }
