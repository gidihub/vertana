import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, withStaff } from "@/app/api/cms/_lib"
import { isHttpsUrl, type CmsAnnouncementRow } from "@/lib/cms/types"

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().max(10000).optional(),
  link_url: z.string().url().nullable().optional(),
  published: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withStaff(async () => {
    const { id } = await params
    const body = patchSchema.parse(await req.json())

    if (body.link_url && !isHttpsUrl(body.link_url)) {
      return NextResponse.json(
        { error: "link_url must be HTTPS" },
        { status: 400 },
      )
    }

    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.body !== undefined) updates.body = body.body.trim()
    if (body.link_url !== undefined) updates.link_url = body.link_url
    if (body.published !== undefined) {
      updates.published = body.published
      updates.published_at = body.published ? new Date().toISOString() : null
    }

    const { data, error } = await cmsAdmin()
      .from("cms_announcements")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ announcement: data as CmsAnnouncementRow })
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withStaff(async () => {
    const { id } = await params
    const { data, error } = await cmsAdmin()
      .from("cms_announcements")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  })
}
