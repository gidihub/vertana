import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, withStaff } from "@/app/api/cms/_lib"
import {
  isValidAnnouncementLink,
  normalizeAnnouncementLink,
} from "@/lib/cms/announcements"
import type { CmsAnnouncementRow } from "@/lib/cms/types"

const linkSchema = z
  .string()
  .max(500)
  .nullable()
  .optional()
  .refine((v) => isValidAnnouncementLink(v), {
    message: "link_url must be a relative path or HTTPS URL",
  })

const patchSchema = z.object({
  body: z.string().min(1).max(500).optional(),
  title: z.string().max(100).optional(),
  link_url: linkSchema,
  published: z.boolean().optional(),
})

async function unpublishOtherAnnouncements(exceptId: string) {
  await cmsAdmin()
    .from("cms_announcements")
    .update({ published: false, published_at: null })
    .eq("published", true)
    .neq("id", exceptId)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withStaff(async () => {
    const { id } = await params
    const body = patchSchema.parse(await req.json())

    if (body.published === true) {
      await unpublishOtherAnnouncements(id)
    }

    const updates: Record<string, unknown> = {}
    if (body.body !== undefined) updates.body = body.body.trim()
    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.link_url !== undefined) {
      updates.link_url = normalizeAnnouncementLink(body.link_url)
    }
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
