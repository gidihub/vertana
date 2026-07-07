// ---------------------------------------------------------------------------
// SUPABASE CLIENT (STUB)
// ---------------------------------------------------------------------------
// This is a placeholder so the data layer has a single, clear seam to wire up
// real Supabase later. Right now nothing here actually talks to Supabase —
// the app runs entirely on the in-memory store in `lib/store.ts`.
//
// TO WIRE UP FOR REAL:
//   1. Add the Supabase integration (adds NEXT_PUBLIC_SUPABASE_URL and
//      NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment).
//   2. `pnpm add @supabase/supabase-js @supabase/ssr`
//   3. Replace the body below with a real browser client, e.g.:
//
//        import { createBrowserClient } from "@supabase/ssr"
//        export function getSupabaseClient() {
//          return createBrowserClient(
//            process.env.NEXT_PUBLIC_SUPABASE_URL!,
//            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//          )
//        }
//
//   4. Swap the in-memory calls in `lib/store.ts` for the queries shown in the
//      TODO comments there.
// ---------------------------------------------------------------------------

export function getSupabaseClient(): never {
  throw new Error(
    "Supabase is not wired up yet. See lib/supabase/client.ts for setup steps.",
  )
}
