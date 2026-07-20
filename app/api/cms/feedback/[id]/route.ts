import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsAdmin, withStaff } from "@/app/api/cms/_lib"
import type { CmsFeedbackRow } from "@/lib/cms/types"

const patchSchema = z.object({
  status: z.enum(["new", "reviewed", "archived"]),
})

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withStaff(async () => {
    const { id } = await ctx.params
    const { status } = patchSchema.parse(await req.json())

    const { data, error } = await cmsAdmin()
      .from("cms_feedback")
      .update({ status })
      .eq("id", id)
      .select("*")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ feedback: data as CmsFeedbackRow })
  })
}
