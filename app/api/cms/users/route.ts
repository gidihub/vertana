import { NextResponse } from "next/server"

import { cmsForbidden } from "@/app/api/cms/_lib"
import { assertStaff } from "@/lib/cms-auth"
import { getCmsUserAnalytics } from "@/lib/cms/users"

export async function GET() {
  const staff = await assertStaff()
  if (!staff) return cmsForbidden()

  try {
    const data = await getCmsUserAnalytics()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[vertana] getCmsUserAnalytics failed:", err)
    return NextResponse.json(
      { error: "Failed to load user analytics." },
      { status: 500 },
    )
  }
}
