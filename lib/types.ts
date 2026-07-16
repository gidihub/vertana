// Shared data model for the recruiting test platform.
// These types map 1:1 onto the Supabase tables you'll create later.

import type { PppTier } from "@/lib/pricing/geo"

export type TestStatus = "draft" | "active" | "closed"

export type TimingPolicy = "strict" | "normal" | "relaxed"

export type QuestionType = "multiple_choice" | "short_answer" | "coding"

export type AiResistance = "low" | "medium" | "high"

export type QuestionSource = "library" | "custom" | "ai_generated"

export type QuestionDifficulty = "easy" | "medium" | "hard"

export interface TestCase {
  input: string
  expected_output: string
}

export type LibraryCategory =
  | "frontend-engineering"
  | "backend-engineering"
  | "data-analyst"
  | "machine-learning"
  | "project-program-associate"
  | "customer-technical-support"
  | "devops-cloud"
  | "qa-testing"
  | "business-financial-analysis"
  | "sales-growth-marketing"
  | "mobile-engineering"
  | "database-administration"
  | "ux-design"
  | "hr-people-management"
  | "ai-assisted-work-sample"
  | "ai-governance"
  | "remote-collaboration"
  | (string & {})

export type CandidateStatus =
  | "invited"
  | "in_progress"
  | "submitted"
  | "expired"

export type CandidateDisposition =
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "hired"

export type InviteEmailStatus = "pending" | "sent" | "failed" | "scheduled"

/** Per-candidate or share-link row in test_invites (not an attempt). */
export interface TestInvite {
  id: string
  test_id: string
  candidate_email: string | null
  token: string
  is_share_link: boolean
  email_status: InviteEmailStatus | null
  email_error: string | null
  email_sent_at: string | null
  status: "active" | "revoked" | "expired"
  /** Per-invite deadline; overrides the test deadline when sooner. */
  expires_at: string | null
  /** When set in the future, the invite email is queued for delivery. */
  scheduled_at: string | null
  /** When the "haven't started" reminder was sent (null if not sent). */
  reminder_not_started_at: string | null
  /** When the "deadline approaching" reminder was sent (null if not sent). */
  reminder_deadline_at: string | null
  /** First time the invite email's tracking pixel loaded (null if never). */
  email_opened_at: string | null
  /** First time the candidate clicked through the invite CTA (null if never). */
  email_clicked_at: string | null
}

export type PlanTier = "free" | "starter" | "growth" | "custom"

export interface Organization {
  id: string
  name: string
  plan_tier: PlanTier
  credits_remaining: number
  credits_reset_at: string
  ai_generations_used: number
  ai_generations_reset_at: string
  code_executions_used: number
  code_executions_reset_at: string
  /** Tab switches at or above this count surface an integrity concern badge. */
  tab_switch_threshold: number
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_status?: string | null
  billing_cycle?: "monthly" | "annual" | null
  current_period_end?: string | null
  ppp_tier?: PppTier | null
  /** Paid extra seats beyond the plan's included allowance. */
  extra_seats?: number
  /** Complimentary/internal org: bypasses credit consumption and paid gates. */
  is_comp?: boolean
  /**
   * Proctoring media retention in days. null = use the global default
   * (PROCTORING_RETENTION_DAYS).
   */
  data_retention_days?: number | null
  /** Default Reply-To for candidate invitation emails. */
  default_reply_to?: string | null
}

// Table: questions
export interface Question {
  id: string
  test_id: string
  type: QuestionType
  prompt: string
  options: string[]
  correct_option_index: number | null
  correct_answer_exact?: string | null
  position: number
  points?: number
  ai_resistance?: AiResistance
  source?: QuestionSource
  library_category?: LibraryCategory | string | null
  category_id?: string | null
  estimated_minutes?: number | null
  difficulty?: QuestionDifficulty | null
  test_cases?: TestCase[]
  created_at?: string
}

export interface LibraryQuestion extends Question {
  is_library_item: true
  test_id: ""
}

export interface TestPlan {
  total_time_minutes: number
  question_count: number
  summary: string
  questions: PlannedQuestion[]
}

export interface PlannedQuestion {
  tempId: string
  type: QuestionType
  prompt: string
  options: string[]
  correct_option_index: number | null
  correct_answer_exact?: string | null
  ai_resistance: AiResistance
  estimated_minutes: number
  difficulty: QuestionDifficulty
  points?: number
  test_cases?: TestCase[]
}

// Table: tests
export interface Test {
  id: string
  org_id?: string
  title: string
  description: string
  time_limit_minutes: number
  passing_score: number // percentage 0-100; score >= this is a pass
  deadline: string | null // ISO date string
  randomize_questions: boolean
  requires_proctoring: boolean
  // When enabled, candidates who finish in the top N% may opt into a public,
  // shareable certificate.
  certificate_eligible: boolean
  certificate_percentile_threshold: number // e.g. 25 means "top 25%"
  timing_policy: TimingPolicy
  forbid_ai_tools: boolean
  notify_emails: string[]
  is_pinned: boolean
  status: TestStatus
  token: string // used for the public candidate link
  created_at: string
  questions: Question[]
}

// Table: certificates
// A public, candidate-owned proof of performance. It intentionally never stores
// the employer's identity or the candidate's raw score — only the skill/test
// name and the percentile band the candidate agreed to make public.
export interface Certificate {
  id: string
  slug: string // public URL slug (unguessable)
  attempt_id?: string
  candidate_name: string
  candidate_email: string // private; used only for removal requests
  test_id: string
  skill_name: string // snapshot of the test title at issue time
  percentile_band: string // e.g. "Top 25%"
  issued_at: string // ISO datetime
  revoked: boolean
}

// Table: consents
// We store the exact consent text + version that was shown, not just a boolean,
// so there is an auditable record of what each candidate actually agreed to.
export interface ConsentRecord {
  id: string
  attempt_id: string
  test_id: string
  consent_version: string
  consent_text_snapshot: string
  accepted: boolean
  responded_at: string // ISO datetime
  ip_address?: string | null
}

// Table: candidates (one row per candidate attempt)
export interface Candidate {
  id: string
  test_id: string
  email: string
  status: CandidateStatus
  score: number | null // percentage 0-100, null until graded
  tab_switch_count: number
  flagged: boolean
  consent_id: string | null
  started_at: string | null
  submitted_at: string | null
  disposition: CandidateDisposition
  user_agent?: string | null
  fullscreen_exits?: number
  mouse_out_count?: number
  time_outside_ms?: number
  resume_count?: number
  dual_screen?: boolean | null
}
