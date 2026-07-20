import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogCmsArticle } from "@/components/marketing/blog-cms-article"
import { BlogLegacyArticle } from "@/components/cms/blog-legacy-article"
import {
  cmsRowExistsForSlug,
  getLegacyPostOrNull,
  getPublicPostBySlug,
  getStaffPreviewPost,
} from "@/lib/cms/blog-queries"
import { blogArticleJsonLd } from "@/lib/marketing/blog-eeat"
import { escapeJsonLd } from "@/lib/cms/sanitize-html"
import { assertStaff } from "@/lib/cms-auth"

export const dynamic = "force-dynamic"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://vertana.io"

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { preview } = await searchParams
  const resolved = await resolvePost(slug, preview === "true")
  if (!resolved) return { title: "Not found · Vertana" }

  const title = resolved.post.title
  const description = resolved.post.excerpt
  const canonical = `/blog/${slug}`
  const updatedAt =
    resolved.kind === "cms"
      ? resolved.post.updated_at
      : resolved.post.updatedAt
  const cover =
    resolved.kind === "cms" ? resolved.post.cover_image_url : null

  return {
    title: `${title} · Vertana`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime:
        resolved.kind === "cms"
          ? resolved.post.published_at ?? undefined
          : resolved.post.publishedAt,
      modifiedTime: updatedAt,
      ...(cover ? { images: [{ url: cover }] } : {}),
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  }
}

async function resolvePost(slug: string, previewRequested: boolean) {
  const cmsExists = await cmsRowExistsForSlug(slug)
  if (cmsExists) {
    if (previewRequested) {
      const staff = await assertStaff()
      if (!staff) notFound()
      const post = await getStaffPreviewPost(slug)
      if (!post) notFound()
      return { kind: "cms" as const, post, preview: true }
    }
    const post = await getPublicPostBySlug(slug)
    if (!post) notFound()
    return { kind: "cms" as const, post, preview: false }
  }

  const legacy = getLegacyPostOrNull(slug)
  if (!legacy) return null
  return { kind: "legacy" as const, post: legacy, preview: false }
}

export default async function BlogArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const resolved = await resolvePost(slug, preview === "true")
  if (!resolved) notFound()

  if (resolved.kind === "cms") {
    const { post } = resolved
    const jsonLd = blogArticleJsonLd({
      title: post.title,
      description: post.excerpt,
      publishedAt: post.published_at ?? post.created_at,
      updatedAt: post.updated_at,
      slug: post.slug,
      siteUrl: SITE_URL,
    })

    return (
      <>
        <BlogCmsArticle post={post} preview={resolved.preview} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: escapeJsonLd(JSON.stringify(jsonLd)),
          }}
        />
      </>
    )
  }

  const jsonLd = blogArticleJsonLd({
    title: resolved.post.title,
    description: resolved.post.excerpt,
    publishedAt: resolved.post.publishedAt,
    updatedAt: resolved.post.updatedAt,
    slug: resolved.post.slug,
    siteUrl: SITE_URL,
  })

  return (
    <>
      <BlogLegacyArticle post={resolved.post} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeJsonLd(JSON.stringify(jsonLd)),
        }}
      />
    </>
  )
}
