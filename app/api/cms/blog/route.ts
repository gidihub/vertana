import { NextResponse } from "next/server"
import { z } from "zod"

import {
  cmsAdmin,
  cmsForbidden,
  withStaff,
} from "@/app/api/cms/_lib"
import { publishDueScheduledPosts } from "@/lib/cms/publish-scheduled"
import {
  estimateReadTime,
  isHttpsUrl,
  slugifyTitle,
  type BlogPostRow,
} from "@/lib/cms/types"

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  category: z.string().max(100).optional(),
  author: z.string().max(100).optional(),
  cover_image_url: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  read_time: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
})

export async function GET() {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()

  await publishDueScheduledPosts()

  const { data, error } = await cmsAdmin()
    .from("blog_posts")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ posts: data as BlogPostRow[] })
}

export async function POST(req: Request) {
  return withStaff(async () => {
    const body = createSchema.parse(await req.json())
    if (body.cover_image_url && !isHttpsUrl(body.cover_image_url)) {
      return NextResponse.json(
        { error: "cover_image_url must be HTTPS" },
        { status: 400 },
      )
    }

    const slug = body.slug.trim() || slugifyTitle(body.title)
    const status = body.status ?? "draft"
    const content = body.content ?? ""
    const now = new Date().toISOString()

    const row = {
      slug,
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() ?? "",
      content,
      category: body.category?.trim() ?? "Guides",
      author: body.author?.trim() ?? "vertana-team",
      cover_image_url: body.cover_image_url ?? null,
      status,
      read_time: body.read_time ?? estimateReadTime(content),
      tags: body.tags ?? [],
      scheduled_at: body.scheduled_at ?? null,
      published_at: status === "published" ? now : null,
    }

    const { data, error } = await cmsAdmin()
      .from("blog_posts")
      .insert(row)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ post: data as BlogPostRow }, { status: 201 })
  })
}
