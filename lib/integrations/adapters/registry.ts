import { webhookAdapter } from "@/lib/integrations/adapters/webhook"
import type { AtsAdapter } from "@/lib/integrations/adapters/types"

/**
 * Maps a connected provider id → the adapter that delivers its events.
 *
 * Today only the generic webhook adapter ships (used by Zapier, and reusable for
 * Make / n8n / custom endpoints). First-class ATS adapters (Greenhouse, Lever,
 * …) slot in here later — a new file implementing {@link AtsAdapter} plus one
 * entry below — with no change to the dispatch core.
 */
const ADAPTER_BY_PROVIDER: Record<string, AtsAdapter> = {
  zapier: webhookAdapter,
}

export function adapterForProvider(providerId: string): AtsAdapter | null {
  return ADAPTER_BY_PROVIDER[providerId] ?? null
}

/** True when a connected provider has an implemented outbound adapter. */
export function providerHasAdapter(providerId: string): boolean {
  return adapterForProvider(providerId) != null
}
