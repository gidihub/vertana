import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  // Local scope clears this browser's auth cookies (which is what actually logs
  // the user out) without a blocking network round-trip to GoTrue to revoke the
  // session globally. That revoke can hang for many seconds on slow/flaky
  // connectivity; users who need to revoke everywhere use the dedicated
  // "sign out other sessions" control (scope: "others") in security settings.
  await supabase.auth.signOut({ scope: "local" })
  return NextResponse.json({ ok: true })
}
