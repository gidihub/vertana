import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Keep in sync with PROCTORING_RETENTION_DAYS in lib/proctoring/config.ts. This
// is reported in the response for observability; the actual deletion is driven
// by each row's `expires_at` (set to capture time + retention at upload).
const RETENTION_DAYS = 60
const PURGE_BATCH_SIZE = 500

// A storage error only justifies deleting the DB row when the object is
// genuinely gone. Transient/permission/network errors must retain the row so a
// later run can retry, rather than orphaning the object behind a dangling record.
function isMissingObjectError(err: unknown): boolean {
  const e = err as {
    statusCode?: string | number
    status?: string | number
    code?: string
    name?: string
    message?: string
  }
  const status = String(e?.statusCode ?? e?.status ?? "")
  const code = `${e?.code ?? ""} ${e?.name ?? ""} ${e?.message ?? ""}`.toLowerCase()
  return (
    status === "404" ||
    code.includes("nosuchkey") ||
    code.includes("not found") ||
    code.includes("object not found")
  )
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) {
    return new Response("Missing Supabase env", { status: 500 })
  }

  const admin = createClient(url, key)

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
  let failed = 0
  for (const row of expired ?? []) {
    const { error: storageErr } = await admin.storage
      .from("proctoring")
      .remove([row.storage_path])
    if (storageErr && !isMissingObjectError(storageErr)) {
      // Transient/permission/network error — keep the row so a later run retries.
      console.error(
        `[purge-proctoring-media] storage remove failed for ${row.storage_path} (id=${row.id}), retaining row:`,
        storageErr.message,
      )
      failed += 1
      continue
    }
    if (storageErr) {
      // Object already gone — safe to delete the dangling DB record.
      console.error(
        `[purge-proctoring-media] storage object missing for ${row.storage_path} (id=${row.id}), deleting record:`,
        storageErr.message,
      )
    }

    const { error: delErr } = await admin
      .from("proctoring_media")
      .delete()
      .eq("id", row.id)
    if (delErr) {
      console.error(
        `[purge-proctoring-media] db delete failed for id=${row.id} (${row.storage_path}):`,
        delErr.message,
      )
      failed += 1
      continue
    }
    deleted += 1
  }

  return Response.json({
    ok: failed === 0,
    scanned: expired?.length ?? 0,
    deleted,
    failed,
    retentionDays: RETENTION_DAYS,
    note: "Wire this function to a daily Supabase cron once proctoring uploads are live.",
  })
})
