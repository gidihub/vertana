/**
 * Vertana RBAC — permission catalog, defaults, and server-side enforcement.
 *
 * The matrix UI reflects these keys; `can()` is the single enforcement gate.
 * Locked roles (owner, admin) always pass. Configurable roles read org overrides
 * from org_role_permissions + org_role_settings.
 */

export const ROLE_IDS = [
  "owner",
  "admin",
  "hiring_manager",
  "recruiter",
  "reviewer",
  "billing_manager",
] as const

export type RoleId = (typeof ROLE_IDS)[number]

export const LOCKED_ROLES: ReadonlySet<RoleId> = new Set(["owner", "admin"])

export const CONFIGURABLE_ROLES: RoleId[] = [
  "hiring_manager",
  "recruiter",
  "reviewer",
  "billing_manager",
]

export const PERMISSION_KEYS = [
  "tests.create",
  "tests.edit",
  "tests.delete",
  "tests.view_library",
  "assessments.create",
  "assessments.edit",
  "assessments.archive",
  "candidates.invite",
  "candidates.grade",
  "candidates.delete",
  "candidates.send_results",
  "candidates.send_reminders",
  "candidates.extend_expiry",
  "media.view",
  "settings.billing",
  "settings.integrations",
  "settings.email_templates",
  "settings.company_info",
  "settings.data_retention",
  "analytics.view_org",
  "team.manage",
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export type AssessmentViewScope = "all" | "assigned"
export type ReviewerScope = "all" | "shared"

export interface RoleScopeSettings {
  assessment_view_scope: AssessmentViewScope
  reviewer_scope: ReviewerScope
}

export interface PermissionMatrixRow {
  key: PermissionKey | "assessments.view_scope" | "reviewer.scope"
  label: string
  description: string
  kind?: "boolean" | "assessment_scope" | "reviewer_scope"
}

export interface PermissionDomain {
  id: string
  label: string
  rows: PermissionMatrixRow[]
}

/** Matrix layout for the Roles settings UI (Farthingly-style grouped rows). */
export const PERMISSION_DOMAINS: PermissionDomain[] = [
  {
    id: "tests",
    label: "Tests",
    rows: [
      {
        key: "tests.create",
        label: "Create tests",
        description: "Build new assessments from scratch or templates",
      },
      {
        key: "tests.edit",
        label: "Edit tests",
        description: "Modify questions, settings, and publishing state",
      },
      {
        key: "tests.delete",
        label: "Delete tests",
        description: "Permanently remove assessments",
      },
      {
        key: "tests.view_library",
        label: "View test library",
        description: "Browse the question library and bundles",
      },
    ],
  },
  {
    id: "assessments",
    label: "Assessments",
    rows: [
      {
        key: "assessments.create",
        label: "Create assessment",
        description: "Publish and activate new assessments",
      },
      {
        key: "assessments.edit",
        label: "Edit assessment",
        description: "Update active assessment configuration",
      },
      {
        key: "assessments.archive",
        label: "Archive assessment",
        description: "Close or archive live assessments",
      },
      {
        key: "assessments.view_scope",
        label: "Assessment visibility",
        description: "View all org assessments or only assigned ones",
        kind: "assessment_scope",
      },
    ],
  },
  {
    id: "candidates",
    label: "Candidates",
    rows: [
      {
        key: "candidates.invite",
        label: "Invite candidates",
        description: "Send email invites and share assessment links",
      },
      {
        key: "candidates.grade",
        label: "Grade candidates",
        description: "Score responses and leave reviewer notes",
      },
      {
        key: "candidates.delete",
        label: "Delete candidates",
        description: "Remove candidate records from the pipeline",
      },
      {
        key: "candidates.send_results",
        label: "Send results to candidates",
        description: "Deliver score reports to candidates",
      },
      {
        key: "candidates.send_reminders",
        label: "Send reminders",
        description: "Nudge candidates who have not started or finished",
      },
      {
        key: "candidates.extend_expiry",
        label: "Extend expiry",
        description: "Extend invite deadlines for individual candidates",
      },
      {
        key: "reviewer.scope",
        label: "Reviewer visibility",
        description: "See all candidates or only those explicitly shared",
        kind: "reviewer_scope",
      },
    ],
  },
  {
    id: "media",
    label: "Identity & proctoring media",
    rows: [
      {
        key: "media.view",
        label: "View identity & proctoring media",
        description:
          "Access face snapshots, session playback, and camera frames — separate from grading rights",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    rows: [
      {
        key: "settings.billing",
        label: "Manage billing & seats",
        description: "Plans, invoices, seat purchases, and payment methods",
      },
      {
        key: "settings.integrations",
        label: "Manage integrations",
        description: "ATS webhooks and third-party connections",
      },
      {
        key: "settings.email_templates",
        label: "Manage email templates",
        description: "Customize invite and notification copy",
      },
      {
        key: "settings.company_info",
        label: "Manage company info",
        description: "Organization name and public-facing details",
      },
      {
        key: "settings.data_retention",
        label: "Manage data & retention",
        description: "Retention windows, deletion requests, and consent logs",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    rows: [
      {
        key: "analytics.view_org",
        label: "View org-wide analytics",
        description: "Funnel, KPI, and activity dashboards across the org",
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    rows: [
      {
        key: "team.manage",
        label: "Manage team members & roles",
        description: "Invite, remove, and change teammate roles",
      },
    ],
  },
]

export const ROLE_LABELS: Record<RoleId, string> = {
  owner: "Owner",
  admin: "Admin",
  hiring_manager: "Hiring Manager",
  recruiter: "Recruiter",
  reviewer: "Reviewer",
  billing_manager: "Billing Manager",
}

export const ROLE_DESCRIPTIONS: Record<RoleId, string> = {
  owner:
    "Account holder with full access. Exactly one per org. Can delete the org or transfer ownership.",
  admin:
    "Full workspace access. Can manage team and settings. Cannot remove the Owner.",
  hiring_manager:
    "Own reqs only — review, grade, and shortlist for roles they own. No billing or team management.",
  recruiter:
    "Create tests, invite candidates, grade, and move people through the pipeline.",
  reviewer:
    "Read-mostly — view results and leave scores or notes. Cannot invite or configure.",
  billing_manager:
    "Billing and seats only. No access to tests, candidates, results, or media.",
}

/** Default boolean permissions per configurable role (seed + preset reset). */
export const DEFAULT_ROLE_PERMISSIONS: Record<
  RoleId,
  Partial<Record<PermissionKey, boolean>>
> = {
  owner: {},
  admin: {},
  hiring_manager: {
    "tests.view_library": true,
    "assessments.edit": true,
    "candidates.invite": true,
    "candidates.grade": true,
    "candidates.send_results": true,
    "candidates.send_reminders": true,
    "candidates.extend_expiry": true,
    "media.view": true,
    "analytics.view_org": true,
  },
  recruiter: {
    "tests.create": true,
    "tests.edit": true,
    "tests.view_library": true,
    "assessments.create": true,
    "assessments.edit": true,
    "candidates.invite": true,
    "candidates.grade": true,
    "candidates.send_reminders": true,
    "candidates.extend_expiry": true,
    "media.view": false,
  },
  reviewer: {
    "tests.view_library": true,
    "candidates.grade": true,
    "media.view": false,
  },
  billing_manager: {
    "settings.billing": true,
  },
}

export const DEFAULT_ROLE_SCOPES: Record<RoleId, RoleScopeSettings> = {
  owner: { assessment_view_scope: "all", reviewer_scope: "all" },
  admin: { assessment_view_scope: "all", reviewer_scope: "all" },
  hiring_manager: {
    assessment_view_scope: "assigned",
    reviewer_scope: "all",
  },
  recruiter: { assessment_view_scope: "assigned", reviewer_scope: "all" },
  reviewer: { assessment_view_scope: "assigned", reviewer_scope: "shared" },
  billing_manager: {
    assessment_view_scope: "assigned",
    reviewer_scope: "shared",
  },
}

export type OrgRolePermissions = Record<PermissionKey, boolean>

export interface OrgPermissionState {
  permissions: Record<RoleId, OrgRolePermissions>
  scopes: Record<RoleId, RoleScopeSettings>
}

function emptyPermissions(): OrgRolePermissions {
  return Object.fromEntries(
    PERMISSION_KEYS.map((k) => [k, false]),
  ) as OrgRolePermissions
}

/** Validate and normalize a full permission map for persistence/audit. */
export function canonicalizeRolePermissions(
  input: Record<string, boolean>,
): OrgRolePermissions {
  const unknown = Object.keys(input).filter(
    (key) => !(PERMISSION_KEYS as readonly string[]).includes(key),
  )
  if (unknown.length > 0) {
    throw new Error(`Unknown permission keys: ${unknown.join(", ")}`)
  }

  const missing = PERMISSION_KEYS.filter((key) => !(key in input))
  if (missing.length > 0) {
    throw new Error(`Missing permission keys: ${missing.join(", ")}`)
  }

  const permissions = {} as OrgRolePermissions
  for (const key of PERMISSION_KEYS) {
    permissions[key] = input[key] === true
  }
  return permissions
}

/** Build the default matrix for a configurable role (all keys explicit). */
export function defaultPermissionsForRole(roleId: RoleId): OrgRolePermissions {
  const base = emptyPermissions()
  const defaults = DEFAULT_ROLE_PERMISSIONS[roleId]
  for (const key of PERMISSION_KEYS) {
    base[key] = defaults[key] ?? false
  }
  return base
}

export function isLockedRole(roleId: RoleId): boolean {
  return LOCKED_ROLES.has(roleId)
}

export interface PermissionContext {
  roleId: RoleId
  permissions: OrgRolePermissions
  scopes: RoleScopeSettings
}

/**
 * Core enforcement gate. Locked roles always pass.
 * Scope-sensitive access must use canViewTest or canViewSharedResource.
 */
export function can(
  ctx: PermissionContext,
  permission: PermissionKey,
): boolean {
  if (isLockedRole(ctx.roleId)) return true
  return ctx.permissions[permission] === true
}

/** Whether this role can see a test under assigned-scope rules. */
export function canViewTest(
  ctx: PermissionContext,
  input: {
    testId: string
    createdBy: string | null
    userId: string
    assignedTestIds: ReadonlySet<string>
  },
): boolean {
  if (isLockedRole(ctx.roleId)) return true

  const scope = ctx.scopes.assessment_view_scope
  if (scope === "all") {
    return (
      can(ctx, "assessments.edit") ||
      can(ctx, "tests.view_library") ||
      can(ctx, "candidates.grade")
    )
  }

  if (input.assignedTestIds.has(input.testId)) return true
  if (input.createdBy && input.createdBy === input.userId) return true
  return false
}

/** Whether the user can see a candidate/attempt under shared-scope rules. */
export function canViewSharedResource(
  ctx: PermissionContext,
  input: {
    sharedTestIds: ReadonlySet<string>
    sharedAttemptIds: ReadonlySet<string>
    testId?: string
    attemptId?: string
  },
): boolean {
  if (isLockedRole(ctx.roleId)) return true

  if (ctx.scopes.reviewer_scope === "all") return true
  if (input.testId && input.sharedTestIds.has(input.testId)) return true
  if (input.attemptId && input.sharedAttemptIds.has(input.attemptId)) return true
  return false
}

export class PermissionDeniedError extends Error {
  status = 403
  constructor(message = "You no longer have access to perform this action") {
    super(message)
    this.name = "PermissionDeniedError"
  }
}

export function assertCan(
  ctx: PermissionContext,
  permission: PermissionKey,
): void {
  if (!can(ctx, permission)) {
    throw new PermissionDeniedError()
  }
}
