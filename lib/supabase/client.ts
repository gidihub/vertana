import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_* equivalents).",
    )
  }
  return createBrowserClient(url, key)
}
