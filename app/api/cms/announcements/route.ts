import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, cmsForbidden, withStaff } from "@/app/api/cms/_lib"
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

const createSchema = z.object({
  body: z.string().min(1).max(500),
  title: z.string().max(100).optional(),
  link_url: linkSchema,
  published: z.boolean().optional(),
})

async function unpublishOtherAnnouncements(exceptId?: string) {
  let q = cmsAdmin()
    .from("cms_announcements")
    .update({ published: false, published_at: null })
    .eq("published", true)
  if (exceptId) q = q.neq("id", exceptId)
  await q
}

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

    const published = body.published ?? false
    if (published) await unpublishOtherAnnouncements()

    const now = new Date().toISOString()
    const row = {
      title: body.title?.trim() ?? "",
      body: body.body.trim(),
      link_url: normalizeAnnouncementLink(body.link_url),
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
