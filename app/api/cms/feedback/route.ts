import { NextResponse } from "next/server"

import { cmsAdmin, cmsForbidden } from "@/app/api/cms/_lib"
import type { CmsFeedbackRow } from "@/lib/cms/types"

export async function GET() {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()

  const { data, error } = await cmsAdmin()
    .from("cms_feedback")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ feedback: data as CmsFeedbackRow[] })
}
