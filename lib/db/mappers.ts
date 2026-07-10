import type { PlanTier } from "@/lib/plans"
import type {
  Candidate,
  CandidateDisposition,
  CandidateStatus,
  Certificate,
  ConsentRecord,
  Question,
  QuestionType,
  Test,
  TestInvite,
  TestStatus,
  TestCase,
} from "@/lib/types"

export interface OrganizationRow {
  id: string
  name: string
  owner_id: string | null
  created_at: string
  plan_tier: PlanTier
  credits_remaining: number
  credits_reset_at: string
  ai_generations_used: number
  ai_generations_reset_at: string
  code_executions_used: number
  code_executions_reset_at: string
  tab_switch_threshold: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  billing_cycle: "monthly" | "annual" | null
  current_period_end: string | null
}

export interface TestRow {
  id: string
  org_id: string
  title: string
  description: string
  time_limit_seconds: number
  deadline: string | null
  randomize_questions: boolean
  requires_proctoring: boolean
  certificate_eligible: boolean
  certificate_percentile_threshold: number
  timing_policy: "strict" | "normal" | "relaxed"
  forbid_ai_tools: boolean
  notify_emails: string[]
  is_pinned: boolean
  status: TestStatus
  created_by: string | null
  created_at: string
}

export interface QuestionRow {
  id: string
  test_id: string | null
  type: QuestionType
  prompt: string
  options: string[]
  correct_answer: CorrectAnswer | null
  points: number
  order_index: number
  ai_resistance: "low" | "medium" | "high"
  source: "library" | "custom" | "ai_generated"
  is_library_item: boolean
  library_category: string | null
  category_id: string | null
  estimated_minutes: number | null
  test_cases: TestCase[]
  created_at?: string
}

export type CorrectAnswer =
  | { kind: "index"; value: number }
  | { kind: "exact"; value: string }

export interface TestInviteRow {
  id: string
  test_id: string
  candidate_email: string | null
  token: string
  status: "active" | "revoked" | "expired"
  expires_at: string | null
  is_share_link: boolean
  email_status: "pending" | "sent" | "failed" | null
  email_error: string | null
  email_sent_at: string | null
}

export function rowToTestInvite(row: TestInviteRow): TestInvite {
  return {
    id: row.id,
    test_id: row.test_id,
    candidate_email: row.candidate_email,
    token: row.token,
    is_share_link: row.is_share_link,
    email_status: row.email_status,
    email_error: row.email_error,
    email_sent_at: row.email_sent_at,
    status: row.status,
  }
}

export interface AttemptRow {
  id: string
  test_invite_id: string
  candidate_email: string
  started_at: string | null
  submitted_at: string | null
  score: number | null
  tab_switch_count: number
  flagged: boolean
  disposition: CandidateDisposition
}

export interface AnswerRow {
  id: string
  attempt_id: string
  question_id: string
  response: string
  is_correct: boolean | null
  points_awarded: number | null
  execution_output: string | null
  execution_status: string | null
  test_cases_passed: number | null
  test_cases_total: number | null
}

export interface ConsentRow {
  id: string
  attempt_id: string
  consent_text_version: string
  consent_text_snapshot: string
  consented_at: string
  ip_address: string | null
}

export interface CertificateRow {
  id: string
  attempt_id: string
  candidate_name: string
  percentile: number | null
  issued_at: string
  public_slug: string
  revoked_at: string | null
}

export function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    test_id: row.test_id ?? "",
    type: row.type,
    prompt: row.prompt,
    options: Array.isArray(row.options) ? row.options : [],
    correct_option_index:
      row.correct_answer?.kind === "index" ? row.correct_answer.value : null,
    correct_answer_exact:
      row.correct_answer?.kind === "exact" ? row.correct_answer.value : null,
    position: row.order_index,
    points: row.points,
    ai_resistance: row.ai_resistance,
    source: row.source,
    library_category: row.library_category,
    category_id: row.category_id,
    estimated_minutes: row.estimated_minutes,
    test_cases: Array.isArray(row.test_cases) ? row.test_cases : [],
    created_at: row.created_at,
  }
}

export function questionToRow(q: Question, testId: string): QuestionRow {
  let correct_answer: CorrectAnswer | null = null
  if (q.type === "multiple_choice" && q.correct_option_index !== null) {
    correct_answer = { kind: "index", value: q.correct_option_index }
  } else if (q.type === "short_answer" && q.correct_answer_exact) {
    correct_answer = { kind: "exact", value: q.correct_answer_exact }
  }

  return {
    id: q.id,
    test_id: testId,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    correct_answer,
    points: q.points ?? 1,
    order_index: q.position,
    ai_resistance: q.ai_resistance ?? "medium",
    source: q.source ?? "custom",
    is_library_item: false,
    library_category: q.library_category ?? null,
    category_id: q.category_id ?? null,
    estimated_minutes: q.estimated_minutes ?? null,
    test_cases: q.test_cases ?? [],
  }
}

export function rowToTest(
  row: TestRow,
  questions: QuestionRow[],
  token: string,
): Test {
  return {
    id: row.id,
    org_id: row.org_id,
    title: row.title,
    description: row.description,
    time_limit_minutes: Math.round(row.time_limit_seconds / 60),
    deadline: row.deadline,
    randomize_questions: row.randomize_questions,
    requires_proctoring: row.requires_proctoring,
    certificate_eligible: row.certificate_eligible,
    certificate_percentile_threshold: row.certificate_percentile_threshold,
    timing_policy: row.timing_policy ?? "normal",
    forbid_ai_tools: row.forbid_ai_tools ?? false,
    notify_emails: Array.isArray(row.notify_emails) ? row.notify_emails : [],
    is_pinned: row.is_pinned ?? false,
    status: row.status,
    token,
    created_at: row.created_at,
    questions: questions
      .sort((a, b) => a.order_index - b.order_index)
      .map(rowToQuestion),
  }
}

export function attemptStatus(row: AttemptRow): CandidateStatus {
  if (row.submitted_at) return "submitted"
  if (row.started_at) return "in_progress"
  return "invited"
}

export function rowToCandidate(
  row: AttemptRow,
  testId: string,
  consentId: string | null,
): Candidate {
  return {
    id: row.id,
    test_id: testId,
    email: row.candidate_email,
    status: attemptStatus(row),
    score: row.score === null ? null : Math.round(Number(row.score)),
    tab_switch_count: row.tab_switch_count,
    flagged: row.flagged,
    consent_id: consentId,
    started_at: row.started_at,
    submitted_at: row.submitted_at,
    disposition: row.disposition ?? "under_review",
  }
}

export function rowToConsent(row: ConsentRow, testId: string): ConsentRecord {
  return {
    id: row.id,
    attempt_id: row.attempt_id,
    test_id: testId,
    consent_version: row.consent_text_version,
    consent_text_snapshot: row.consent_text_snapshot,
    accepted: true,
    responded_at: row.consented_at,
    ip_address: row.ip_address,
  }
}

export function rowToCertificate(
  row: CertificateRow,
  testId: string,
  candidateEmail: string,
  skillName: string,
): Certificate {
  return {
    id: row.id,
    slug: row.public_slug,
    attempt_id: row.attempt_id,
    candidate_name: row.candidate_name,
    candidate_email: candidateEmail,
    test_id: testId,
    skill_name: skillName,
    percentile_band:
      row.percentile !== null ? `Top ${Math.round(row.percentile)}%` : "Top tier",
    issued_at: row.issued_at,
    revoked: row.revoked_at !== null,
  }
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16)
}

export function gradeAnswer(
  question: QuestionRow,
  response: string,
): { isCorrect: boolean | null; pointsAwarded: number } {
  if (question.type === "multiple_choice") {
    const expected =
      question.correct_answer?.kind === "index"
        ? String(question.correct_answer.value)
        : null
    if (expected === null) return { isCorrect: null, pointsAwarded: 0 }
    const isCorrect = response === expected
    return {
      isCorrect,
      pointsAwarded: isCorrect ? question.points : 0,
    }
  }

  if (question.type === "short_answer") {
    const expected =
      question.correct_answer?.kind === "exact"
        ? question.correct_answer.value.trim().toLowerCase()
        : null
    if (!expected) return { isCorrect: null, pointsAwarded: 0 }
    const isCorrect = response.trim().toLowerCase() === expected
    return {
      isCorrect,
      pointsAwarded: isCorrect ? question.points : 0,
    }
  }

  return { isCorrect: null, pointsAwarded: 0 }
}

export function computeScore(
  questions: QuestionRow[],
  answerRows: AnswerRow[],
): number | null {
  const gradable = questions.filter(
    (q) =>
      q.type === "multiple_choice" ||
      (q.type === "short_answer" && q.correct_answer?.kind === "exact") ||
      (q.type === "coding" && q.test_cases.length > 0),
  )
  if (gradable.length === 0) return null

  const answerMap = new Map(answerRows.map((a) => [a.question_id, a]))
  let earned = 0
  let total = 0
  for (const q of gradable) {
    total += q.points
    const answer = answerMap.get(q.id)
    if (answer?.points_awarded != null) {
      const awarded = Number(answer.points_awarded)
      earned += Number.isFinite(awarded)
        ? Math.min(Math.max(awarded, 0), q.points)
        : 0
    } else if (answer?.is_correct) {
      earned += q.points
    }
  }
  return total > 0 ? Math.round((earned / total) * 100) : null
}
