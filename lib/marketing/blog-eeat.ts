/** Shared E-E-A-T constants for the Vertana blog / resources hub. */

export const BLOG_TEAM_BYLINE = "The Vertana Team" as const

export const BLOG_TEAM_DESCRIPTION =
  "Vertana builds AI-resistant skills assessments for hiring teams. We write about what we learn from designing assessments, running them on our platform, and curating our question library."

export const BLOG_EDITORIAL_STANDARDS_PATH = "/blog/editorial-standards" as const

export const BLOG_PRODUCT_DISCLOSURE =
  "Disclosure: Vertana is our product. Where we mention it below, we label it clearly. The frameworks and examples stand on their own whether or not you use our platform."

export type BlogSource = {
  title: string
  url: string
  publisher: string
  year: number
}

export type BlogPostMeta = {
  slug: string
  publishedAt: string // ISO date
  updatedAt: string // ISO date
  sources: BlogSource[]
  /** Short, labelled first-hand observation from building/running assessments. */
  experienceNote?: string
  /** Internal slugs for related posts. */
  relatedPostSlugs?: string[]
  /** Set when a post is materially revised. */
  correctionNote?: string
}

/** Verified sources reused across posts — do not add unverified entries here. */
export const BLOG_SOURCES = {
  schmidtHunter1998: {
    title:
      "The validity and utility of selection methods in personnel psychology: Practical and theoretical implications of 85 years of research findings",
    url: "https://doi.org/10.1037/0033-2909.124.2.262",
    publisher: "Psychological Bulletin",
    year: 1998,
  },
  eeocUniformGuidelines: {
    title: "Uniform Guidelines on Employee Selection Procedures",
    url: "https://www.eeoc.gov/laws/guidance/uniform-guidelines-employee-selection-procedures",
    publisher: "U.S. Equal Employment Opportunity Commission",
    year: 1978,
  },
  gdprOverview: {
    title: "General Data Protection Regulation (GDPR) — official text",
    url: "https://gdpr-info.eu/",
    publisher: "Intersoft Consulting (official text aggregation)",
    year: 2016,
  },
  euAiAct: {
    title: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (AI Act)",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    publisher: "Publications Office of the European Union",
    year: 2024,
  },
  vertanaGdpr: {
    title: "Vertana GDPR compliance overview",
    url: "https://vertana.io/legal/gdpr",
    publisher: "Vertana",
    year: 2026,
  },
} satisfies Record<string, BlogSource>

export function blogArticleJsonLd(input: {
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  slug: string
  siteUrl: string
}) {
  const url = `${input.siteUrl}/blog/${input.slug}`
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt,
    author: {
      "@type": "Organization",
      name: "Vertana",
      url: input.siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Vertana",
      url: input.siteUrl,
    },
    mainEntityOfPage: url,
  }
}
