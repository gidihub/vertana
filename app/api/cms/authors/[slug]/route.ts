import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, cmsForbidden, withStaff } from "@/app/api/cms/_lib"
import { isHttpsUrl, type BlogAuthorRow } from "@/lib/cms/types"

const patchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    title: z.string().max(200).optional(),
    bio: z.string().max(5000).optional(),
    avatar_url: z.string().url().nullable().optional(),
    twitter_url: z.string().url().nullable().optional(),
    linkedin_url: z.string().url().nullable().optional(),
    published: z.boolean().optional(),
  })
  .strict()

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()

  const { slug } = await ctx.params
  const { data, error } = await cmsAdmin()
    .from("blog_authors")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ author: data as BlogAuthorRow })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  return withStaff(async () => {
    const { slug } = await ctx.params
    const parsed = patchSchema.parse(await req.json())

    for (const url of [
      parsed.avatar_url,
      parsed.twitter_url,
      parsed.linkedin_url,
    ]) {
      if (url && url !== null && !isHttpsUrl(url)) {
        return NextResponse.json(
          { error: "URLs must use HTTPS" },
          { status: 400 },
        )
      }
    }

    const patch: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(parsed)) {
      if (val !== undefined) patch[key] = val
    }

    const { data, error } = await cmsAdmin()
      .from("blog_authors")
      .update(patch)
      .eq("slug", slug)
      .select("*")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ author: data as BlogAuthorRow })
  })
}
