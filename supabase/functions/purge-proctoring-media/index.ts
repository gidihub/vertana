import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RETENTION_DAYS = 90
const PURGE_BATCH_SIZE = 500

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) {
    return new Response("Missing Supabase env", { status: 500 })
  }

  const admin = createClient(url, key)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

  const { data: expired, error } = await admin
    .from("proctoring_media")
    .select("id, storage_path")
    .lt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true })
    .limit(PURGE_BATCH_SIZE)

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  let deleted = 0
  for (const row of expired ?? []) {
    const { error: storageErr } = await admin.storage
      .from("proctoring")
      .remove([row.storage_path])
    if (storageErr) {
      console.error(
        `[purge-proctoring-media] storage remove failed for ${row.storage_path}:`,
        storageErr.message,
      )
      continue
    }

    const { error: delErr } = await admin
      .from("proctoring_media")
      .delete()
      .eq("id", row.id)
    if (!delErr) deleted += 1
  }

  return Response.json({
    ok: true,
    scanned: expired?.length ?? 0,
    deleted,
    retentionDays: RETENTION_DAYS,
    note: "Wire this function to a daily Supabase cron once proctoring uploads are live.",
  })
})
