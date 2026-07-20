import { redirect } from "next/navigation"

import { BLOG_EDITORIAL_STANDARDS_PATH } from "@/lib/marketing/blog-eeat"

/** Individual author pages are not used — redirect to editorial standards. */
export default function BlogAuthorRedirectPage() {
  redirect(BLOG_EDITORIAL_STANDARDS_PATH)
}
