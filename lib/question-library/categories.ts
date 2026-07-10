/** Two-level question library taxonomy (parent → leaf categories). */

export type LibraryCategoryRecord = {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  priority_tier: 1 | 2 | 3
  /** Legacy flat slug migrated into this leaf (if any). */
  legacy_slug?: string
}

/** Leaf categories hold questions; parents are grouping nodes only. */
export const LIBRARY_CATEGORIES: LibraryCategoryRecord[] = [
  // ── Tier 1: Engineering ──
  { id: "engineering", name: "Engineering", parent_id: null, sort_order: 1, priority_tier: 1 },
  {
    id: "frontend-engineering",
    name: "Frontend Engineering",
    parent_id: "engineering",
    sort_order: 1,
    priority_tier: 1,
    legacy_slug: "frontend",
  },
  {
    id: "backend-engineering",
    name: "Backend Engineering",
    parent_id: "engineering",
    sort_order: 2,
    priority_tier: 1,
    legacy_slug: "backend",
  },
  {
    id: "devops-cloud",
    name: "DevOps & Cloud",
    parent_id: "engineering",
    sort_order: 3,
    priority_tier: 2,
  },
  {
    id: "qa-testing",
    name: "QA & Testing",
    parent_id: "engineering",
    sort_order: 4,
    priority_tier: 2,
  },
  {
    id: "mobile-engineering",
    name: "Mobile Engineering",
    parent_id: "engineering",
    sort_order: 5,
    priority_tier: 3,
  },
  {
    id: "database-administration",
    name: "Database Administration",
    parent_id: "engineering",
    sort_order: 6,
    priority_tier: 3,
  },

  // ── Tier 1: Data & Analytics ──
  {
    id: "data-analytics",
    name: "Data & Analytics",
    parent_id: null,
    sort_order: 2,
    priority_tier: 1,
  },
  {
    id: "data-analyst",
    name: "Data Analyst / Data Science",
    parent_id: "data-analytics",
    sort_order: 1,
    priority_tier: 1,
    legacy_slug: "data",
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    parent_id: "data-analytics",
    sort_order: 2,
    priority_tier: 1,
    legacy_slug: "ml",
  },

  // ── Tier 1: Business ──
  { id: "business", name: "Business", parent_id: null, sort_order: 3, priority_tier: 1 },
  {
    id: "project-program-associate",
    name: "Project & Program Associate",
    parent_id: "business",
    sort_order: 1,
    priority_tier: 1,
    legacy_slug: "consulting",
  },
  {
    id: "business-financial-analysis",
    name: "Business & Financial Analysis",
    parent_id: "business",
    sort_order: 2,
    priority_tier: 2,
  },
  {
    id: "customer-technical-support",
    name: "Customer & Technical Support",
    parent_id: "business",
    sort_order: 3,
    priority_tier: 2,
    legacy_slug: "ops",
  },
  {
    id: "sales-growth-marketing",
    name: "Sales & Growth Marketing",
    parent_id: "business",
    sort_order: 4,
    priority_tier: 2,
  },
  {
    id: "ux-design",
    name: "UX & Design",
    parent_id: "business",
    sort_order: 5,
    priority_tier: 3,
  },
  {
    id: "hr-people-management",
    name: "HR & People Management",
    parent_id: "business",
    sort_order: 6,
    priority_tier: 3,
  },

  // ── New 2026: AI Fluency ──
  {
    id: "ai-fluency",
    name: "AI Fluency",
    parent_id: null,
    sort_order: 4,
    priority_tier: 2,
  },
  {
    id: "ai-assisted-work-sample",
    name: "AI-Assisted Work Sample",
    parent_id: "ai-fluency",
    sort_order: 1,
    priority_tier: 2,
  },
  {
    id: "ai-governance",
    name: "AI Governance & Responsible Use",
    parent_id: "ai-fluency",
    sort_order: 2,
    priority_tier: 2,
  },

  // ── New 2026: Ways of Working ──
  {
    id: "ways-of-working",
    name: "Ways of Working",
    parent_id: null,
    sort_order: 5,
    priority_tier: 2,
  },
  {
    id: "remote-collaboration",
    name: "Remote Collaboration & Async Communication",
    parent_id: "ways-of-working",
    sort_order: 1,
    priority_tier: 2,
  },
]

const byId = new Map(LIBRARY_CATEGORIES.map((c) => [c.id, c]))

/** Maps legacy flat slugs (frontend, ml, consulting, …) to new leaf ids. */
export const LEGACY_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  LIBRARY_CATEGORIES.filter((c) => c.legacy_slug).map((c) => [
    c.legacy_slug!,
    c.id,
  ]),
)

export function libraryCategoryById(id: string): LibraryCategoryRecord | undefined {
  return byId.get(id)
}

export function libraryCategoryLabel(id: string | null | undefined): string {
  if (!id) return "General"
  return libraryCategoryById(id)?.name ?? id
}

export function libraryParentCategories(): LibraryCategoryRecord[] {
  return LIBRARY_CATEGORIES.filter((c) => c.parent_id === null).sort(
    (a, b) => a.sort_order - b.sort_order,
  )
}

export function libraryChildCategories(
  parentId: string,
): LibraryCategoryRecord[] {
  return LIBRARY_CATEGORIES.filter((c) => c.parent_id === parentId).sort(
    (a, b) => a.sort_order - b.sort_order,
  )
}

/** Leaf ids that should match when filtering (parent expands to all children). */
export function libraryFilterCategoryIds(
  selected: string | "",
): string[] | null {
  if (!selected) return null
  const node = byId.get(selected)
  if (!node) return [selected]
  const children = libraryChildCategories(selected)
  if (children.length > 0) return children.map((c) => c.id)
  return [selected]
}

/** DB filter values for library_category (works before and after migration 013). */
export function libraryFilterCategoryValues(
  selected: string | "",
): string[] | null {
  const ids = libraryFilterCategoryIds(selected)
  if (!ids?.length) return null
  const values = new Set<string>()
  for (const id of ids) {
    values.add(id)
    const cat = libraryCategoryById(id)
    if (cat?.legacy_slug) values.add(cat.legacy_slug)
  }
  return [...values]
}

export function libraryCategoryTree() {
  return libraryParentCategories().map((parent) => ({
    ...parent,
    children: libraryChildCategories(parent.id),
  }))
}
