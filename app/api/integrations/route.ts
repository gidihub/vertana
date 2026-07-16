import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

import { handleApiAuth } from "@/lib/auth/api"
import { getIntegration, type IntegrationStatus } from "@/lib/integrations/catalog"
import { adapterForProvider } from "@/lib/integrations/adapters"
import { assertSafeWebhookUrl } from "@/lib/integrations/ssrf"
import { atsEnabledForTier, type PlanTier } from "@/lib/plans"
import { createAdminClient } from "@/lib/supabase/admin"

const connectSchema = z.object({
  provider: z.string().min(1),
  config: z.record(z.string(), z.string()).default({}),
})

async function orgAtsEntitled(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
): Promise<boolean> {
  const { data: org } = await admin
    .from("organizations")
    .select("plan_tier, is_comp")
    .eq("id", orgId)
    .maybeSingle()
  if (org?.is_comp) return true
  return atsEnabledForTier((org?.plan_tier as PlanTier | undefined) ?? "free")
}

export async function GET() {
  return handleApiAuth(async ({ orgId }) => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("org_integrations")
      .select(
        "provider, status, updated_at, sync_status, last_synced_at, last_error, last_error_at",
      )
      .eq("org_id", orgId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Secrets in `config` are intentionally never returned to the client.
    const integrations: IntegrationStatus[] = (data ?? []).map((row) => ({
      provider: row.provider as string,
      status: row.status as "connected" | "disabled",
      updatedAt: row.updated_at as string,
      syncStatus: (row.sync_status as IntegrationStatus["syncStatus"]) ?? "idle",
      lastSyncedAt: (row.last_synced_at as string | null) ?? null,
      lastError: (row.last_error as string | null) ?? null,
      lastErrorAt: (row.last_error_at as string | null) ?? null,
    }))

    const atsEntitled = await orgAtsEntitled(admin, orgId)
    return NextResponse.json({ integrations, atsEntitled })
  })
}

export async function POST(req: Request) {
  return handleApiAuth(async ({ orgId, user, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can manage integrations" },
        { status: 403 },
      )
    }

    let body: z.infer<typeof connectSchema>
    try {
      body = connectSchema.parse(await req.json())
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    const provider = getIntegration(body.provider)
    if (!provider) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
    }

    // Require every declared credential field.
    for (const field of provider.fields) {
      if (!body.config[field.key]?.trim()) {
        return NextResponse.json(
          { error: `Missing ${field.label}` },
          { status: 400 },
        )
      }
    }

    // Block obvious SSRF targets for any customer-supplied webhook URL — the
    // server will POST to whatever is stored.
    if (typeof body.config.webhookUrl === "string") {
      try {
        assertSafeWebhookUrl(body.config.webhookUrl)
      } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 })
      }
    }

    // Providers with an outbound adapter get a per-integration signing secret,
    // returned once so the receiver can verify HMAC signatures.
    const hasAdapter = adapterForProvider(provider.id) != null
    const secret = hasAdapter ? randomBytes(32).toString("hex") : null

    const admin = createAdminClient()
    const { error } = await admin.from("org_integrations").upsert(
      {
        org_id: orgId,
        provider: provider.id,
        status: "connected",
        config: body.config,
        connected_by: user.id,
        updated_at: new Date().toISOString(),
        // Reset delivery health on (re)connect.
        sync_status: "idle",
        last_error: null,
        last_error_at: null,
        ...(secret ? { secret } : {}),
      },
      { onConflict: "org_id,provider" },
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, secret })
  })
}

export async function DELETE(req: Request) {
  return handleApiAuth(async ({ orgId, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const provider = searchParams.get("provider")
    if (!provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from("org_integrations")
      .delete()
      .eq("org_id", orgId)
      .eq("provider", provider)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  })
}
