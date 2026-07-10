export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY ?? ""
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? ""
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey())
}

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000"
  return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`
}
