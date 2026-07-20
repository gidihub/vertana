import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, cmsForbidden, withStaff } from "@/app/api/cms/_lib"
import { isHttpsUrl, type BlogAuthorRow } from "@/lib/cms/types"

const createSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  title: z.string().max(200).optional(),
  bio: z.string().max(5000).optional(),
  avatar_url: z.string().url().nullable().optional(),
  twitter_url: z.string().url().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  published: z.boolean().optional(),
})

export async function GET() {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()

  const { data, error } = await cmsAdmin()
    .from("blog_authors")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ authors: data as BlogAuthorRow[] })
}

export async function POST(req: Request) {
  return withStaff(async () => {
    const body = createSchema.parse(await req.json())

    for (const url of [
      body.avatar_url,
      body.twitter_url,
      body.linkedin_url,
    ]) {
      if (url && !isHttpsUrl(url)) {
        return NextResponse.json(
          { error: "URLs must use HTTPS" },
          { status: 400 },
        )
      }
    }

    const row = {
      slug: body.slug.trim(),
      name: body.name.trim(),
      title: body.title?.trim() ?? "",
      bio: body.bio?.trim() ?? "",
      avatar_url: body.avatar_url ?? null,
      twitter_url: body.twitter_url ?? null,
      linkedin_url: body.linkedin_url ?? null,
      published: body.published ?? true,
    }

    const { data, error } = await cmsAdmin()
      .from("blog_authors")
      .insert(row)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ author: data as BlogAuthorRow }, { status: 201 })
  })
}
