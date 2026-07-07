import { AuthError, requireRecruiter } from "@/lib/auth/recruiter"
import { NextResponse } from "next/server"

export async function handleApiAuth<T>(
  handler: (ctx: Awaited<ReturnType<typeof requireRecruiter>>) => Promise<T>,
): Promise<T | NextResponse> {
  try {
    const ctx = await requireRecruiter()
    return await handler(ctx)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
