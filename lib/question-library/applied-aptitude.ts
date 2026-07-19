/** Applied Aptitude — general screening using work artifacts (not psychometric). */

export const APPLIED_APTITUDE_PARENT_ID = "applied-aptitude"

export const APPLIED_APTITUDE_LEAF_IDS = [
  "reading-comprehension",
  "attention-to-detail",
  "following-instructions",
  "applied-numeracy",
  "numerical-reasoning",
  "critical-thinking",
  "problem-solving",
] as const

export type AppliedAptitudeLeafId = (typeof APPLIED_APTITUDE_LEAF_IDS)[number]

export function isAppliedAptitudeCategory(
  id: string | null | undefined,
): boolean {
  if (!id) return false
  return (
    id === APPLIED_APTITUDE_PARENT_ID ||
    APPLIED_APTITUDE_LEAF_IDS.includes(id as AppliedAptitudeLeafId)
  )
}

export const APPLIED_APTITUDE_PARENT_DESCRIPTION =
  "Applied work skills using real documents, tables, and briefs — reading accuracy, detail checking, instruction-following, and everyday numeracy. This is not a psychometric, IQ, or intelligence test. Use as one input alongside role-specific assessment, not as a sole cutoff."

export const APPLIED_APTITUDE_LEAF_DESCRIPTIONS: Record<
  AppliedAptitudeLeafId,
  string
> = {
  "reading-comprehension":
    "Extract and interpret meaning from policies, emails, specs, and meeting notes.",
  "attention-to-detail":
    "Spot errors and mismatches in invoices, tables, forms, and spec pairs.",
  "following-instructions":
    "Execute multi-step procedures exactly as written, including exceptions.",
  "applied-numeracy":
    "Everyday arithmetic in receipts, timesheets, discounts, and budgets (USD).",
  "numerical-reasoning":
    "Interpret charts, KPI tables, and variance reports — not abstract puzzles.",
  "critical-thinking":
    "Evaluate claims, assumptions, and evidence in memos and analyses.",
  "problem-solving":
    "Structure an approach to ambiguous work scenarios with incomplete info.",
}

/** Recommend proctoring for screens built from this category (hint only). */
export const APPLIED_APTITUDE_PROCTORING_RECOMMENDED = true

export const APPLIED_APTITUDE_BUILDER_GUIDANCE =
  "Applied Aptitude items are text-heavy and easier to solve with pasted AI assistance. Proctoring is recommended (not required) for high-volume screens — combine with role-specific assessment rather than using as a sole cutoff."
