import type { MetadataRoute } from "next"

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertana.io"
).replace(/\/$/, "")

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/settings", "/library", "/tests/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
