// Shared data model for the recruiting test platform.
// These types map 1:1 onto the Supabase tables you'll create later.

export type TestStatus = "draft" | "active" | "closed"

export type QuestionType = "multiple_choice" | "short_answer" | "coding"

export type CandidateStatus =
  | "invited"
  | "in_progress"
  | "submitted"
  | "expired"

// Table: questions
export interface Question {
  id: string
  test_id: string
  type: QuestionType
  prompt: string
  // MCQ only: 2-6 options and the index of the correct one.
  options: string[]
  correct_option_index: number | null
  position: number
}

// Table: tests
export interface Test {
  id: string
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
  candidate_id: string
  test_id: string
  consent_version: string
  consent_text_snapshot: string
  accepted: boolean
  responded_at: string // ISO datetime
}

// Table: candidates (one row per candidate attempt)
export interface Candidate {
  id: string
  test_id: string
  email: string
  status: CandidateStatus
  score: number | null // percentage 0-100, null until graded
  tab_switch_count: number
  consent_id: string | null
  started_at: string | null
  submitted_at: string | null
}
