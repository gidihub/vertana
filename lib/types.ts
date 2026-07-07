// Shared data model for the recruiting test platform.
// These types map 1:1 onto the Supabase tables you'll create later.

export type TestStatus = "draft" | "active" | "closed"

export type QuestionType = "multiple_choice" | "short_answer" | "coding"

export type AiResistance = "low" | "medium" | "high"

export type QuestionSource = "library" | "custom" | "ai_generated"

export type QuestionDifficulty = "easy" | "medium" | "hard"

export type LibraryCategory = "frontend" | "backend" | "data" | "ops"

export type CandidateStatus =
  | "invited"
  | "in_progress"
  | "submitted"
  | "expired"

export type PlanTier = "free" | "starter" | "growth" | "custom"

export interface Organization {
  id: string
  name: string
  plan_tier: PlanTier
  credits_remaining: number
  credits_reset_at: string
  ai_generations_used: number
  ai_generations_reset_at: string
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
  estimated_minutes?: number | null
  difficulty?: QuestionDifficulty | null
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
}

// Table: tests
export interface Test {
  id: string
  org_id?: string
  title: string
  description: string
  time_limit_minutes: number
  deadline: string | null // ISO date string
  randomize_questions: boolean
  requires_proctoring: boolean
  // When enabled, candidates who finish in the top N% may opt into a public,
  // shareable certificate.
  certificate_eligible: boolean
  certificate_percentile_threshold: number // e.g. 25 means "top 25%"
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
}
