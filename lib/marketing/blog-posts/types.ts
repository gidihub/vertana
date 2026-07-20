import type { BlogSource } from "@/lib/marketing/blog-eeat"

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "callout"; title: string; text: string }

export interface BlogPost {
  slug: string
  title: string
  category: "Guides" | "Comparisons" | "Compliance" | "Hiring science"
  intent: string
  excerpt: string // unique meta description, 150-160 chars
  publishedAt: string // ISO date
  updatedAt: string // ISO date
  featured?: boolean
  experienceNote?: string // labelled first-hand observation
  sources: BlogSource[]
  relatedPostSlugs: string[]
  blocks: BlogBlock[]
  related: Array<{ label: string; href: string }> // product/use-case links
}
