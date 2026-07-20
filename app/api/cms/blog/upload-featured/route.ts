import { randomUUID } from "crypto"

import { NextResponse } from "next/server"

import { cmsAdmin, withStaff } from "@/app/api/cms/_lib"
import { cacheBustPublicUrl, validateImageUpload } from "@/lib/cms/upload"

export async function POST(req: Request) {
  return withStaff(async () => {
    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const validated = validateImageUpload(buffer)
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const path = `uploaded/${randomUUID()}.${validated.ext}`
    const admin = cmsAdmin()
    const { error: uploadError } = await admin.storage
      .from("blog-featured")
      .upload(path, buffer, {
        contentType: validated.contentType,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = admin.storage.from("blog-featured").getPublicUrl(path)
    const url = cacheBustPublicUrl(data.publicUrl)
    return NextResponse.json({ url })
  })
}
