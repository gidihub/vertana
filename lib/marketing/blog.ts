// Blog content model for Vertana's resource hub.
// Post bodies live in ./blog-posts/; shared E-E-A-T constants in ./blog-eeat.ts.

import { countWordsInPost as countWords } from "./blog-posts"
import type { BlogPost } from "./blog-posts/types"

export type { BlogBlock, BlogPost } from "./blog-posts/types"
export {
  BLOG_POSTS,
  countWordsInPost,
  getBlogPost,
  getFeaturedPost,
  getRelatedPosts,
} from "./blog-posts"

export { BLOG_TEAM_BYLINE as BLOG_AUTHOR } from "./blog-eeat"

export function formatBlogDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function readingTimeLabel(post: BlogPost): string {
  const words = countWords(post)
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} min read`
}
