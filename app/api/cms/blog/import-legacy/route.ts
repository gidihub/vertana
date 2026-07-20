import { NextResponse } from "next/server"

import { cmsForbidden, withStaff } from "@/app/api/cms/_lib"
import {
  importLegacyBlogPosts,
  legacyBlogImportSummary,
} from "@/lib/cms/legacy-blog-import"

export async function GET() {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()
  return NextResponse.json(legacyBlogImportSummary())
}

export async function POST() {
  return withStaff(async () => {
    try {
      const result = await importLegacyBlogPosts()
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      )
    }
  })
}
