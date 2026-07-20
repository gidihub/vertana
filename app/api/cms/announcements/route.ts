import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, cmsForbidden, withStaff } from "@/app/api/cms/_lib"
import { isHttpsUrl, type CmsAnnouncementRow } from "@/lib/cms/types"

const createSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().max(10000).optional(),
  link_url: z.string().url().nullable().optional(),
  published: z.boolean().optional(),
})

export async function GET() {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()

  const { data, error } = await cmsAdmin()
    .from("cms_announcements")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ announcements: data as CmsAnnouncementRow[] })
}

export async function POST(req: Request) {
  return withStaff(async () => {
    const body = createSchema.parse(await req.json())

    if (body.link_url && !isHttpsUrl(body.link_url)) {
      return NextResponse.json(
        { error: "link_url must be HTTPS" },
        { status: 400 },
      )
    }

    const published = body.published ?? false
    const now = new Date().toISOString()
    const row = {
      title: body.title.trim(),
      body: body.body?.trim() ?? "",
      link_url: body.link_url ?? null,
      published,
      published_at: published ? now : null,
    }

    const { data, error } = await cmsAdmin()
      .from("cms_announcements")
      .insert(row)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { announcement: data as CmsAnnouncementRow },
      { status: 201 },
    )
  })
}
