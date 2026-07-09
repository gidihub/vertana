const ENV_DEFAULT = Math.max(
  1,
  Number(process.env.VERTANA_TAB_SWITCH_THRESHOLD) || 3,
)

/** @deprecated Use org tab_switch_threshold when available. */
export const TAB_SWITCH_INTEGRITY_THRESHOLD = ENV_DEFAULT

export function resolveIntegrityThreshold(
  orgThreshold?: number | null,
): number {
  if (orgThreshold != null && Number.isFinite(orgThreshold) && orgThreshold >= 1) {
    return Math.floor(orgThreshold)
  }
  return ENV_DEFAULT
}

export function hasIntegrityConcern(
  tabSwitchCount: number,
  threshold?: number | null,
): boolean {
  return tabSwitchCount >= resolveIntegrityThreshold(threshold)
}
