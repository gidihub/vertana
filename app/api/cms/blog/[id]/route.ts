import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, cmsForbidden, withStaff } from "@/app/api/cms/_lib"
import {
  BLOG_PATCH_ALLOWLIST,
  estimateReadTime,
  isHttpsUrl,
  type BlogPostRow,
} from "@/lib/cms/types"

const patchSchema = z
  .object({
    slug: z.string().min(1).max(200).optional(),
    title: z.string().min(1).max(300).optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().optional(),
    category: z.string().max(100).optional(),
    author: z.string().max(100).optional(),
    cover_image_url: z.string().url().nullable().optional(),
    status: z.enum(["draft", "published"]).optional(),
    read_time: z.string().max(50).optional(),
    tags: z.array(z.string()).optional(),
    scheduled_at: z.string().datetime().nullable().optional(),
    published_at: z.string().datetime().nullable().optional(),
  })
  .strict()

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()

  const { id } = await ctx.params
  const { data, error } = await cmsAdmin()
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ post: data as BlogPostRow })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withStaff(async () => {
    const { id } = await ctx.params
    const parsed = patchSchema.parse(await req.json())

    if (
      parsed.cover_image_url &&
      parsed.cover_image_url !== null &&
      !isHttpsUrl(parsed.cover_image_url)
    ) {
      return NextResponse.json(
        { error: "cover_image_url must be HTTPS" },
        { status: 400 },
      )
    }

    const patch: Record<string, unknown> = {}
    for (const key of BLOG_PATCH_ALLOWLIST) {
      if (key in parsed) {
        patch[key] = parsed[key as keyof typeof parsed]
      }
    }

    if (typeof parsed.content === "string" && !parsed.read_time) {
      patch.read_time = estimateReadTime(parsed.content)
    }

    if (parsed.status === "published") {
      const { data: existing } = await cmsAdmin()
        .from("blog_posts")
        .select("published_at")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle()
      if (!existing?.published_at) {
        patch.published_at = new Date().toISOString()
      }
      patch.scheduled_at = null
    }

    const { data, error } = await cmsAdmin()
      .from("blog_posts")
      .update(patch)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ post: data as BlogPostRow })
  })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withStaff(async () => {
    const { id } = await ctx.params
    const { data, error } = await cmsAdmin()
      .from("blog_posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  })
}
