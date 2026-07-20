import type { MetadataRoute } from "next"

import { ASSESSMENT_LANDINGS } from "@/lib/marketing/assessments"
import { BLOG_POSTS } from "@/lib/marketing/blog"
import { COMPARISONS } from "@/lib/marketing/compare"
import { FEATURES, USE_CASES } from "@/lib/marketing/content"
import { LEGAL_DOCS } from "@/lib/marketing/legal"

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertana.io"
).replace(/\/$/, "")

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    {
      url: `${SITE_URL}/blog/editorial-standards`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    { url: `${SITE_URL}/assessments`, changeFrequency: "weekly", priority: 0.8 },
  ]

  const assessments = ASSESSMENT_LANDINGS.map((page) => ({
    url: `${SITE_URL}/assessments/${page.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }))

  const blog = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }))

  const features = FEATURES.map((feature) => ({
    url: `${SITE_URL}/features/${feature.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const legal = LEGAL_DOCS.map((doc) => ({
    url: `${SITE_URL}/legal/${doc.slug}`,
    lastModified: new Date(doc.updated),
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }))

  const useCases = USE_CASES.map((useCase) => ({
    url: `${SITE_URL}/use-cases/${useCase.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const compare = COMPARISONS.map((cmp) => ({
    url: `${SITE_URL}/compare/${cmp.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...assessments,
    ...blog,
    ...features,
    ...legal,
    ...useCases,
    ...compare,
  ]
}
