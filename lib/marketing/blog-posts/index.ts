import type { BlogPost } from "./types"
import { HOW_TO_ASSESS_FRONTEND_ENGINEERS } from "./how-to-assess-frontend-engineers"
import { PREVENT_CHEATING_REMOTE_TECHNICAL_INTERVIEWS } from "./prevent-cheating-remote-technical-interviews"
import { TAKE_HOME_TESTS_VS_LIVE_CODING } from "./take-home-tests-vs-live-coding"
import { REDUCE_BIAS_STRUCTURED_SKILLS_ASSESSMENTS } from "./reduce-bias-structured-skills-assessments"
import { HIRING_IN_THE_AGE_OF_AI_CHEATING } from "./hiring-in-the-age-of-ai-cheating"
import { AI_RESISTANT_INTERVIEW_QUESTIONS } from "./ai-resistant-interview-questions"
import { STRUCTURED_HIRING_REDUCES_BIAS } from "./structured-hiring-reduces-bias"

export type { BlogBlock, BlogPost } from "./types"

export const BLOG_POSTS: BlogPost[] = [
  HOW_TO_ASSESS_FRONTEND_ENGINEERS,
  PREVENT_CHEATING_REMOTE_TECHNICAL_INTERVIEWS,
  TAKE_HOME_TESTS_VS_LIVE_CODING,
  REDUCE_BIAS_STRUCTURED_SKILLS_ASSESSMENTS,
  HIRING_IN_THE_AGE_OF_AI_CHEATING,
  AI_RESISTANT_INTERVIEW_QUESTIONS,
  STRUCTURED_HIRING_REDUCES_BIAS,
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function getFeaturedPost(): BlogPost {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0]
}

export function getRelatedPosts(slug: string, limit = 2): BlogPost[] {
  const current = getBlogPost(slug)
  if (!current) return BLOG_POSTS.slice(0, limit)

  const byExplicit = current.relatedPostSlugs
    .map((s) => getBlogPost(s))
    .filter((p): p is BlogPost => p !== undefined && p.slug !== slug)

  const seen = new Set(byExplicit.map((p) => p.slug))
  const byCategory = BLOG_POSTS.filter(
    (p) => p.slug !== slug && p.category === current.category && !seen.has(p.slug),
  )
  for (const p of byCategory) seen.add(p.slug)

  const rest = BLOG_POSTS.filter((p) => p.slug !== slug && !seen.has(p.slug))

  return [...byExplicit, ...byCategory, ...rest].slice(0, limit)
}

function blockWordCount(block: BlogPost["blocks"][number]): number {
  if (block.type === "bullets") {
    return block.items.join(" ").split(/\s+/).filter(Boolean).length
  }
  if (block.type === "callout") {
    return `${block.title} ${block.text}`.split(/\s+/).filter(Boolean).length
  }
  return block.text.split(/\s+/).filter(Boolean).length
}

export function countWordsInPost(post: BlogPost): number {
  return post.blocks.reduce((sum, block) => sum + blockWordCount(block), 0)
}
