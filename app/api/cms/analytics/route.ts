import { NextResponse } from "next/server"
import { z } from "zod"

import { cmsForbidden } from "@/app/api/cms/_lib"
import { getCmsGrowthAnalytics } from "@/lib/cms/analytics"
import { DEFAULT_RANGE, type RangeKey } from "@/lib/dashboard/filters"

const querySchema = z.object({
  range: z
    .enum([
      "all",
      "today",
      "yesterday",
      "7d",
      "15d",
      "30d",
      "90d",
      "180d",
    ])
    .default(DEFAULT_RANGE),
})

export async function GET(req: Request) {
  const staff = await import("@/lib/cms-auth").then((m) => m.assertStaff())
  if (!staff) return cmsForbidden()

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    range: searchParams.get("range") ?? DEFAULT_RANGE,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 })
  }

  try {
    const data = await getCmsGrowthAnalytics(parsed.data.range as RangeKey)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
