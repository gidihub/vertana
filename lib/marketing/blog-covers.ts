/** Default cover art when a post has no `cover_image_url`. */
const CATEGORY_COVERS: Record<string, string> = {
  Guides: "/blog/covers/guides.svg",
  Comparisons: "/blog/covers/comparisons.svg",
  Compliance: "/blog/covers/compliance.svg",
  "Hiring science": "/blog/covers/hiring-science.svg",
}

export const DEFAULT_BLOG_COVER = "/blog/covers/default.svg"

export function resolveBlogCoverUrl(
  cover: string | null | undefined,
  category: string,
): string {
  const trimmed = cover?.trim()
  if (trimmed) return trimmed
  return CATEGORY_COVERS[category] ?? DEFAULT_BLOG_COVER
}
