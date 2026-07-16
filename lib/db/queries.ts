import {
  computeScore,
  generateToken,
  gradeAnswer,
  questionToRow,
  attemptStatus,
  rowToCandidate,
  rowToConsent,
  rowToQuestion,
  rowToTest,
  rowToTestInvite,
  type AnswerRow,
  type AttemptRow,
  type ConsentRow,
  type QuestionRow,
  type TestInviteRow,
  type TestRow,
} from "@/lib/db/mappers"
import { gradeCodingAnswer } from "@/lib/execution/grade-coding"
import { duplicateQuestionsError } from "@/lib/questions/duplicates"
import {
  consumeCredits,
  InsufficientCreditsError,
} from "@/lib/credits/ledger"
import { recordCodeExecutions } from "@/lib/org"
import {
  ensureMonthlyResets,
  ensureMonthlyResetsForOrgId,
  getOrgId,
  getOrganization,
  getOrganizationById,
} from "@/lib/org"
import {
  certificatesEnabledForTier,
  PLAN_LIMITS,
  proctoringEnabledForTier,
  type PlanTier,
} from "@/lib/plans"
import { sanitizeQuestionsForPlan } from "@/lib/coding/limits"
import type { PppTier } from "@/lib/billing/ppp"
import { notifyTestCompletion } from "@/lib/notifications/completion-email"
import { buildAtsEvent, dispatchAtsEvent } from "@/lib/integrations/dispatch"
import { sendCandidateInviteEmail } from "@/lib/notifications/candidate-invite-email"
import { sendCandidateReminderEmail } from "@/lib/notifications/reminder-email"
import { createAdminClient } from "@/lib/supabase/admin"
import { proctoringExpiresAt } from "@/lib/proctoring/retention"
import { proctoringPolicyForTier } from "@/lib/proctoring/config"
import type {
  Candidate,
  ConsentRecord,
  Test,
  TestInvite,
  TestStatus,
} from "@/lib/types"

export class TokenAccessError extends Error {
  code: "invalid" | "closed" | "expired" | "revoked"
  constructor(message: string, code: TokenAccessError["code"]) {
    super(message)
    this.code = code
  }
}

function isPastDeadline(deadline: string | null): boolean {
  if (!deadline) return false
  return new Date(deadline).getTime() < Date.now()
}

function validateInviteAccess(
  invite: TestInviteRow,
  test: TestRow,
): void {
  if (invite.status === "revoked") {
    throw new TokenAccessError("This assessment link has been revoked.", "revoked")
  }
  if (invite.status === "expired") {
    throw new TokenAccessError("This assessment link has expired.", "expired")
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    throw new TokenAccessError("This assessment link has expired.", "expired")
  }
  if (test.status === "draft") {
    throw new TokenAccessError("This assessment is not published yet.", "invalid")
  }
  if (test.status === "closed") {
    throw new TokenAccessError("This assessment is closed.", "closed")
  }
  if (isPastDeadline(test.deadline)) {
    throw new TokenAccessError("This assessment deadline has passed.", "expired")
  }
}

export interface CertificateEvaluation {
  qualifies: boolean
  band: string
  topPercent: number
}

export interface AttemptAnswerView {
  question_id: string
  prompt: string
  type: QuestionRow["type"]
  response: string
  is_correct: boolean | null
  points_awarded: number | null
  max_points: number
  execution_output: string | null
  execution_status: string | null
  test_cases_passed: number | null
  test_cases_total: number | null
  ai_suggested_points: number | null
  ai_suggested_rationale: string | null
}

export async function fetchShareInvite(
  testId: string,
): Promise<TestInviteRow | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("test_invites")
    .select("*")
    .eq("test_id", testId)
    .eq("is_share_link", true)
    .maybeSingle()
  return (data as TestInviteRow | null) ?? null
}

export async function ensureShareInvite(testId: string): Promise<string> {
  const existing = await fetchShareInvite(testId)
  if (existing) return existing.token

  const token = generateToken()
  const supabase = createAdminClient()
  const { error } = await supabase.from("test_invites").insert({
    test_id: testId,
    token,
    is_share_link: true,
    status: "active",
  })
  if (error) throw new Error(error.message)
  return token
}

export async function loadTestById(testId: string): Promise<Test | null> {
  const orgId = await getOrgId()
  const supabase = createAdminClient()

  const { data: testRow, error } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .eq("org_id", orgId)
    .maybeSingle()

  if (error || !testRow) return null

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", testId)
    .order("order_index", { ascending: true })

  const invite = await fetchShareInvite(testId)
  return rowToTest(
    testRow as TestRow,
    (questions ?? []) as QuestionRow[],
    invite?.token ?? "",
  )
}

export async function loadTestsForOrg(orgId?: string): Promise<Test[]> {
  const resolvedOrgId = orgId ?? (await getOrgId())
  const supabase = createAdminClient()

  const { data: tests, error } = await supabase
    .from("tests")
    .select("*")
    .eq("org_id", resolvedOrgId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  if (!tests?.length) return []

  const testIds = tests.map((t) => t.id)
  // Questions and share-link invites both depend only on testIds, so fetch them
  // concurrently rather than serially.
  const [{ data: questions }, { data: invites }] = await Promise.all([
    supabase
      .from("questions")
      .select("*")
      .in("test_id", testIds)
      .order("order_index", { ascending: true }),
    supabase
      .from("test_invites")
      .select("*")
      .in("test_id", testIds)
      .eq("is_share_link", true),
  ])

  const questionsByTest = new Map<string, QuestionRow[]>()
  for (const q of (questions ?? []) as QuestionRow[]) {
    if (!q.test_id) continue
    const list = questionsByTest.get(q.test_id) ?? []
    list.push(q)
    questionsByTest.set(q.test_id, list)
  }

  const tokenByTest = new Map<string, string>()
  for (const inv of (invites ?? []) as TestInviteRow[]) {
    tokenByTest.set(inv.test_id, inv.token)
  }

  return (tests as TestRow[]).map((row) =>
    rowToTest(row, questionsByTest.get(row.id) ?? [], tokenByTest.get(row.id) ?? ""),
  )
}

export async function saveTestRecord(
  test: Test,
  meta?: { creatorEmail?: string | null; creatorUserId?: string | null },
): Promise<Test> {
  const orgId = await getOrgId()
  const org = await ensureMonthlyResets(await getOrganization())

  if (
    test.requires_proctoring &&
    !org.is_comp &&
    !proctoringEnabledForTier(org.plan_tier as PlanTier)
  ) {
    throw new Error(
      "Proctoring is available on paid plans only. Upgrade to Starter or higher to enable proctoring, or turn it off to save this test.",
    )
  }

  const duplicateError = duplicateQuestionsError(test.questions)
  if (duplicateError) throw new Error(duplicateError)

  if (test.status === "active" && !org.is_comp) {
    const supabase = createAdminClient()
    const { count } = await supabase
      .from("tests")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active")
      .neq("id", test.id)

    const activeLimit = PLAN_LIMITS[org.plan_tier as PlanTier].activeTests
    if (activeLimit !== null && (count ?? 0) >= activeLimit) {
      throw new Error(
        `Your ${org.plan_tier} plan allows ${activeLimit} active tests. Close or draft another test to publish.`,
      )
    }
  }

  const supabase = createAdminClient()

  const { data: existingRow } = await supabase
    .from("tests")
    .select("created_by")
    .eq("id", test.id)
    .maybeSingle()

  let notifyEmails = (test.notify_emails ?? []).filter(Boolean)
  if (notifyEmails.length === 0 && meta?.creatorEmail) {
    notifyEmails = [meta.creatorEmail]
  }

  const testRow = {
    id: test.id,
    org_id: orgId,
    title: test.title,
    description: test.description,
    time_limit_seconds: (test.time_limit_minutes || 30) * 60,
    passing_score: Math.min(Math.max(Math.round(test.passing_score ?? 70), 0), 100),
    deadline: test.deadline,
    randomize_questions: test.randomize_questions,
    requires_proctoring: test.requires_proctoring,
    certificate_eligible: test.certificate_eligible,
    certificate_percentile_threshold: test.certificate_percentile_threshold,
    timing_policy: test.timing_policy ?? "normal",
    forbid_ai_tools: test.forbid_ai_tools ?? false,
    notify_emails: notifyEmails,
    is_pinned: test.is_pinned ?? false,
    status: test.status,
    created_by:
      (existingRow?.created_by as string | null | undefined) ??
      meta?.creatorUserId ??
      null,
    created_at: test.created_at,
  }

  const { error: testError } = await supabase.from("tests").upsert(testRow)
  if (testError) throw new Error(testError.message)

  const { data: existingQuestionRows } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", test.id)

  const existingQuestions = ((existingQuestionRows ?? []) as QuestionRow[]).map(
    rowToQuestion,
  )
  const sanitizedQuestions = sanitizeQuestionsForPlan(
    test.questions,
    existingQuestions,
    org.plan_tier as PlanTier,
    (org.ppp_tier as PppTier | null) ?? null,
  )

  const questionRows = sanitizedQuestions.map((q) => questionToRow(q, test.id))

  const incomingIds = new Set(questionRows.map((q) => q.id))
  const toDelete = (existingQuestionRows ?? [])
    .map((q) => q.id as string)
    .filter((id) => !incomingIds.has(id))

  if (toDelete.length) {
    await supabase.from("questions").delete().in("id", toDelete)
  }

  if (questionRows.length) {
    const { error: qError } = await supabase.from("questions").upsert(questionRows)
    if (qError) throw new Error(qError.message)
  }

  let token = test.token
  if (test.status === "active") {
    token = await ensureShareInvite(test.id)
  }

  return {
    ...test,
    org_id: orgId,
    token,
    notify_emails: notifyEmails,
    questions: sanitizedQuestions,
  }
}

export async function setTestStatusRecord(
  testId: string,
  status: Test["status"],
): Promise<void> {
  const test = await loadTestById(testId)
  if (!test) throw new Error("Test not found")
  await saveTestRecord({ ...test, status })
}

export async function setTestPinnedRecord(
  testId: string,
  isPinned: boolean,
): Promise<void> {
  const test = await loadTestById(testId)
  if (!test) throw new Error("Test not found")
  await saveTestRecord({ ...test, is_pinned: isPinned })
}

export async function deleteTestRecord(testId: string): Promise<void> {
  const orgId = await getOrgId()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("tests")
    .delete()
    .eq("id", testId)
    .eq("org_id", orgId)
  if (error) throw new Error(error.message)
}

export async function loadCandidatesForTest(testId: string): Promise<Candidate[]> {
  const supabase = createAdminClient()
  const { data: invites } = await supabase
    .from("test_invites")
    .select("id")
    .eq("test_id", testId)

  const inviteIds = (invites ?? []).map((i) => i.id)
  if (!inviteIds.length) return []

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*")
    .in("test_invite_id", inviteIds)
    .order("started_at", { ascending: false })

  if (!attempts?.length) return []

  const attemptIds = attempts.map((a) => a.id)
  const { data: consents } = await supabase
    .from("consents")
    .select("id, attempt_id")
    .in("attempt_id", attemptIds)

  const consentByAttempt = new Map<string, string>()
  for (const c of consents ?? []) {
    consentByAttempt.set(c.attempt_id as string, c.id as string)
  }

  return (attempts as AttemptRow[]).map((row) =>
    rowToCandidate(row, testId, consentByAttempt.get(row.id) ?? null),
  )
}

export async function loadConsent(consentId: string): Promise<ConsentRecord | null> {
  const supabase = createAdminClient()
  const { data: consent, error } = await supabase
    .from("consents")
    .select("*, attempts(test_invites(test_id))")
    .eq("id", consentId)
    .maybeSingle()

  if (error || !consent) return null

  const testId =
    (consent.attempts as { test_invites: { test_id: string } } | null)?.test_invites
      ?.test_id ?? ""

  return rowToConsent(
    {
      id: consent.id,
      attempt_id: consent.attempt_id,
      consent_text_version: consent.consent_text_version,
      consent_text_snapshot: consent.consent_text_snapshot,
      consented_at: consent.consented_at,
      ip_address: consent.ip_address,
    },
    testId,
  )
}

export interface ProctoringMediaView {
  id: string
  kind: "camera" | "screen" | "face_match"
  created_at: string
  expires_at: string
  /** Short-lived signed URL for the recruiter to view the media. */
  url: string | null
  /** Question the candidate was viewing when captured; null for identity/legacy media. */
  question_id: string | null
  question_index: number | null
}

/**
 * Recruiter-facing proctoring media for a single attempt, scoped to the caller's
 * org via the test id. Returns signed URLs (1h) for each stored object.
 */
export async function loadProctoringMedia(
  testId: string,
  attemptId: string,
): Promise<ProctoringMediaView[]> {
  // Enforces org ownership of the test; throws/returns empty otherwise.
  const test = await loadTestById(testId)
  if (!test) return []

  const supabase = createAdminClient()

  // Confirm the attempt actually belongs to this test before returning media.
  const { data: invites } = await supabase
    .from("test_invites")
    .select("id")
    .eq("test_id", testId)
  const inviteIds = (invites ?? []).map((i) => i.id)
  if (!inviteIds.length) return []

  const { data: attempt } = await supabase
    .from("attempts")
    .select("id")
    .eq("id", attemptId)
    .in("test_invite_id", inviteIds)
    .maybeSingle()
  if (!attempt) return []

  return signAttemptMedia(supabase, attemptId)
}

/**
 * Fetches and signs proctoring media for an attempt WITHOUT re-checking org
 * ownership or test/attempt linkage. Callers must have already validated that
 * the attempt belongs to a test the caller's org owns.
 */
async function signAttemptMedia(
  supabase: ReturnType<typeof createAdminClient>,
  attemptId: string,
): Promise<ProctoringMediaView[]> {
  const { data: media } = await supabase
    .from("proctoring_media")
    .select("id, kind, storage_path, created_at, expires_at, question_id, question_index")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true })

  if (!media?.length) return []

  const paths = media.map((row) => row.storage_path as string)
  const { data: signed } = await supabase.storage
    .from("proctoring")
    .createSignedUrls(paths, 60 * 60)

  return media.map((row, i) => ({
    id: row.id as string,
    kind: row.kind as ProctoringMediaView["kind"],
    created_at: row.created_at as string,
    expires_at: row.expires_at as string,
    url: signed?.[i]?.signedUrl ?? null,
    question_id: (row.question_id as string | null) ?? null,
    question_index: (row.question_index as number | null) ?? null,
  }))
}

/**
 * Runs an `.in(column, ids)` fetch in parallel chunks and flattens the result.
 * Keeps individual PostgREST requests small enough to avoid URL-length limits
 * on large orgs, while still issuing the chunks concurrently.
 */
async function fetchByIdsInChunks<T>(
  ids: string[],
  fetchChunk: (chunk: string[]) => PromiseLike<{ data: T[] | null }>,
  chunkSize = 300,
): Promise<T[]> {
  if (!ids.length) return []
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize))
  }
  const results = await Promise.all(chunks.map((chunk) => fetchChunk(chunk)))
  return results.flatMap((r) => r.data ?? [])
}

export async function loadAllCandidates(tests?: Test[]): Promise<Candidate[]> {
  const resolvedTests = tests ?? (await loadTestsForOrg())
  const testIds = resolvedTests.map((t) => t.id)
  if (!testIds.length) return []

  const supabase = createAdminClient()

  // 1) All email + share invites for the org's tests, in one batched query.
  const inviteRows = await fetchByIdsInChunks<{ id: string; test_id: string }>(
    testIds,
    (chunk) =>
      supabase.from("test_invites").select("id, test_id").in("test_id", chunk),
  )
  const testIdByInvite = new Map<string, string>()
  for (const inv of inviteRows) testIdByInvite.set(inv.id, inv.test_id)
  const inviteIds = [...testIdByInvite.keys()]
  if (!inviteIds.length) return []

  // 2) All attempts across those invites.
  const attempts = await fetchByIdsInChunks<AttemptRow>(inviteIds, (chunk) =>
    supabase
      .from("attempts")
      .select("*")
      .in("test_invite_id", chunk)
      .order("started_at", { ascending: false }),
  )
  if (!attempts.length) return []

  // 3) Consents for those attempts (only the id linkage is needed here).
  const attemptIds = attempts.map((a) => a.id)
  const consents = await fetchByIdsInChunks<{ id: string; attempt_id: string }>(
    attemptIds,
    (chunk) =>
      supabase.from("consents").select("id, attempt_id").in("attempt_id", chunk),
  )
  const consentByAttempt = new Map<string, string>()
  for (const c of consents) consentByAttempt.set(c.attempt_id, c.id)

  // Global recency order matches the previous per-test ordering closely enough
  // for the dashboard, which re-sorts client-side.
  attempts.sort((a, b) =>
    (b.started_at ?? "").localeCompare(a.started_at ?? ""),
  )

  return attempts.map((row) =>
    rowToCandidate(
      row,
      testIdByInvite.get(row.test_invite_id) ?? "",
      consentByAttempt.get(row.id) ?? null,
    ),
  )
}

/**
 * Lightweight, unsigned proctoring-media metadata for an attempt. Lets the
 * report decide which evidence tabs to show and whether media was purged,
 * without signing URLs or fetching biometric imagery on initial load — the
 * evidence panel signs and loads the actual media only when expanded.
 */
export interface AttemptMediaSummary {
  total: number
  kinds: ProctoringMediaView["kind"][]
  earliest: string | null
  latest: string | null
  /** Durable marker that media was captured for this attempt, even if since purged. */
  everCaptured: boolean
}

export interface CandidateAttemptDetail {
  candidate: Candidate
  test: Test
  answers: AttemptAnswerView[]
  consent: ConsentRecord | null
  mediaSummary: AttemptMediaSummary
}

async function loadAttemptMediaSummary(
  supabase: ReturnType<typeof createAdminClient>,
  attemptId: string,
  everCapturedMarker: boolean,
): Promise<AttemptMediaSummary> {
  const { data, error } = await supabase
    .from("proctoring_media")
    .select("kind, created_at")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to load proctoring media summary: ${error.message}`)
  }

  const rows = (data ?? []) as { kind: string; created_at: string }[]
  if (rows.length === 0) {
    return {
      total: 0,
      kinds: [],
      earliest: null,
      latest: null,
      everCaptured: everCapturedMarker,
    }
  }
  const kinds = [
    ...new Set(rows.map((r) => r.kind)),
  ] as ProctoringMediaView["kind"][]
  return {
    total: rows.length,
    kinds,
    earliest: rows[0].created_at,
    latest: rows[rows.length - 1].created_at,
    everCaptured: everCapturedMarker || rows.length > 0,
  }
}

export interface CandidateProfileData {
  email: string
  attempts: CandidateAttemptDetail[]
}

/**
 * Aggregates everything for a single candidate (identified by email) across all
 * of the caller's org tests: each attempt with its test, graded answers,
 * consent record, and proctoring media. Scoped to the org by only querying
 * attempts that belong to org-owned test invites, and filtered to the given
 * email at the database level.
 */
export async function loadCandidateProfile(
  email: string,
): Promise<CandidateProfileData> {
  const normalized = email.trim().toLowerCase()
  const supabase = createAdminClient()

  // Org-scoped tests double as a warm cache for the attempts below.
  const tests = await loadTestsForOrg()
  const testById = new Map(tests.map((t) => [t.id, t]))
  const testIds = tests.map((t) => t.id)
  if (!testIds.length) return { email: normalized, attempts: [] }

  const { data: invites } = await supabase
    .from("test_invites")
    .select("id, test_id")
    .in("test_id", testIds)

  const testIdByInvite = new Map<string, string>()
  for (const inv of invites ?? []) {
    testIdByInvite.set(inv.id as string, inv.test_id as string)
  }
  const inviteIds = [...testIdByInvite.keys()]
  if (!inviteIds.length) return { email: normalized, attempts: [] }

  // Email- and org-scoped: only this candidate's attempts on org-owned invites.
  const escapedEmail = normalized.replace(/[%_\\]/g, (ch) => `\\${ch}`)
  const { data: attemptRows } = await supabase
    .from("attempts")
    .select("*")
    .in("test_invite_id", inviteIds)
    .ilike("candidate_email", escapedEmail)
    .order("started_at", { ascending: false })

  if (!attemptRows?.length) return { email: normalized, attempts: [] }

  const attemptIds = (attemptRows as AttemptRow[]).map((a) => a.id)
  const { data: consents } = await supabase
    .from("consents")
    .select("id, attempt_id")
    .in("attempt_id", attemptIds)

  const consentByAttempt = new Map<string, string>()
  for (const c of consents ?? []) {
    consentByAttempt.set(c.attempt_id as string, c.id as string)
  }

  const attempts = await Promise.all(
    (attemptRows as AttemptRow[]).map(async (row) => {
      const testId = testIdByInvite.get(row.test_invite_id) ?? ""
      const test = testById.get(testId)
      if (!test) return null

      const candidate = rowToCandidate(
        row,
        testId,
        consentByAttempt.get(row.id) ?? null,
      )

      const [answers, consent, mediaSummary] = await Promise.all([
        candidate.status === "submitted"
          ? loadAttemptAnswers(testId, candidate.id)
          : Promise.resolve([]),
        candidate.consent_id
          ? loadConsent(candidate.consent_id)
          : Promise.resolve(null),
        // Only metadata here (no signed URLs) — the evidence panel lazily signs
        // and loads media when the recruiter expands it.
        test.requires_proctoring
          ? loadAttemptMediaSummary(
              supabase,
              candidate.id,
              row.proctoring_media_captured === true,
            )
          : Promise.resolve({
              total: 0,
              kinds: [],
              earliest: null,
              latest: null,
              everCaptured: false,
            } satisfies AttemptMediaSummary),
      ])

      return {
        candidate,
        test,
        answers,
        consent,
        mediaSummary,
      } satisfies CandidateAttemptDetail
    }),
  )

  const resolved = attempts.filter(
    (a): a is CandidateAttemptDetail => a !== null,
  )

  resolved.sort((a, b) => {
    const at = a.candidate.submitted_at ?? a.candidate.started_at ?? ""
    const bt = b.candidate.submitted_at ?? b.candidate.started_at ?? ""
    return bt.localeCompare(at)
  })

  return { email: normalized, attempts: resolved }
}

export async function loadTestByToken(token: string): Promise<{
  test: Test
  invite: TestInviteRow
} | null> {
  const supabase = createAdminClient()
  const { data: invite, error } = await supabase
    .from("test_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle()

  if (error || !invite) return null

  const { data: testRow } = await supabase
    .from("tests")
    .select("*")
    .eq("id", invite.test_id)
    .maybeSingle()

  if (!testRow) return null

  try {
    validateInviteAccess(invite as TestInviteRow, testRow as TestRow)
  } catch {
    return null
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", invite.test_id)
    .order("order_index", { ascending: true })

  return {
    invite: invite as TestInviteRow,
    test: rowToTest(
      testRow as TestRow,
      (questions ?? []) as QuestionRow[],
      invite.token,
    ),
  }
}

export async function getTokenAccessState(token: string): Promise<{
  ok: boolean
  code?: TokenAccessError["code"]
  test?: Test
}> {
  const supabase = createAdminClient()
  const { data: invite } = await supabase
    .from("test_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle()

  if (!invite) return { ok: false, code: "invalid" }

  const { data: testRow } = await supabase
    .from("tests")
    .select("*")
    .eq("id", invite.test_id)
    .maybeSingle()

  if (!testRow) return { ok: false, code: "invalid" }

  try {
    validateInviteAccess(invite as TestInviteRow, testRow as TestRow)
  } catch (err) {
    if (err instanceof TokenAccessError) {
      return { ok: false, code: err.code }
    }
    return { ok: false, code: "invalid" }
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", invite.test_id)
    .order("order_index", { ascending: true })

  return {
    ok: true,
    test: rowToTest(
      testRow as TestRow,
      (questions ?? []) as QuestionRow[],
      invite.token,
    ),
  }
}

export async function checkCandidateStatus(input: {
  token: string
  email: string
}): Promise<{
  status: "new" | "in_progress" | "submitted"
  attemptId?: string
  submittedAt?: string
}> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new TokenAccessError("Invalid test link", "invalid")

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("attempts")
    .select("id, submitted_at, started_at")
    .eq("test_invite_id", loaded.invite.id)
    .eq("candidate_email", input.email.toLowerCase())
    .maybeSingle()

  if (!existing) return { status: "new" }
  if (existing.submitted_at) {
    return {
      status: "submitted",
      attemptId: existing.id,
      submittedAt: existing.submitted_at,
    }
  }
  return { status: "in_progress", attemptId: existing.id }
}

export async function loadAttemptForResume(input: {
  token: string
  attemptId: string
  email: string
}): Promise<{
  answers: Record<string, string>
  tabSwitchCount: number
  startedAt: string | null
}> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const supabase = createAdminClient()
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, submitted_at, tab_switch_count, started_at, candidate_email")
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .maybeSingle()

  if (!attempt || attempt.submitted_at) {
    throw new Error("Attempt not found or already submitted")
  }
  if (attempt.candidate_email !== input.email.toLowerCase()) {
    throw new Error("Attempt does not match this email")
  }

  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_id, response")
    .eq("attempt_id", input.attemptId)

  const answers: Record<string, string> = {}
  for (const row of answerRows ?? []) {
    answers[row.question_id as string] = row.response as string
  }

  return {
    answers,
    tabSwitchCount: attempt.tab_switch_count ?? 0,
    startedAt: attempt.started_at,
  }
}

export async function startAttempt(input: {
  token: string
  email: string
}): Promise<{ attemptId: string; resumed: boolean }> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new TokenAccessError("Invalid test link", "invalid")

  if (
    !loaded.invite.is_share_link &&
    loaded.invite.candidate_email &&
    input.email.toLowerCase() !== loaded.invite.candidate_email.toLowerCase()
  ) {
    throw new TokenAccessError(
      "This assessment link was sent to a different email address.",
      "invalid",
    )
  }

  const orgId = loaded.test.org_id!
  const proctored = loaded.test.requires_proctoring
  const org = await ensureMonthlyResetsForOrgId(orgId)

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("attempts")
    .select("id, submitted_at")
    .eq("test_invite_id", loaded.invite.id)
    .eq("candidate_email", input.email.toLowerCase())
    .maybeSingle()

  if (existing?.submitted_at) {
    throw new Error("You have already completed this assessment.")
  }

  if (existing?.id) {
    // Resuming an existing attempt — proctoring credits were already consumed
    // when the attempt was first created, so no fresh credit check is needed.
    // Count the resume as an integrity signal ("completed in one attempt").
    const { data: row } = await supabase
      .from("attempts")
      .select("resume_count")
      .eq("id", existing.id)
      .maybeSingle()
    await supabase
      .from("attempts")
      .update({ resume_count: (row?.resume_count ?? 0) + 1 })
      .eq("id", existing.id)
    return { attemptId: existing.id, resumed: true }
  }

  // Proctoring is a paid feature. If the org has since downgraded to Free while
  // proctored tests still exist, block new attempts rather than silently running
  // them unproctored. (Existing in-progress attempts above are allowed to resume.)
  if (
    proctored &&
    !org.is_comp &&
    !proctoringEnabledForTier(org.plan_tier as PlanTier)
  ) {
    throw new Error(
      "This proctored assessment is temporarily unavailable — the hiring team needs to upgrade their plan to run it.",
    )
  }

  // Only new attempts reserve credits: proctored attempts reserve 2 at start
  // (recording begins now); unproctored attempts reserve nothing until submit.
  // Comp orgs never reserve or consume credits.
  const requiredAtStart = proctored ? 2 : 1
  if (!org.is_comp && org.credits_remaining < requiredAtStart) {
    throw new Error(
      "This assessment is temporarily unavailable — the hiring team has no candidate credits remaining.",
    )
  }

  const now = new Date().toISOString()
  const { data: attempt, error } = await supabase
    .from("attempts")
    .insert({
      test_invite_id: loaded.invite.id,
      candidate_email: input.email.toLowerCase(),
      started_at: now,
    })
    .select("id")
    .single()

  if (error || !attempt) {
    // A concurrent start won the race and created the row first — resume it
    // rather than creating a duplicate (unique index on invite+email).
    if (error?.code === "23505") {
      const { data: raced } = await supabase
        .from("attempts")
        .select("id")
        .eq("test_invite_id", loaded.invite.id)
        .eq("candidate_email", input.email.toLowerCase())
        .maybeSingle()
      if (raced?.id) return { attemptId: raced.id, resumed: true }
    }
    throw new Error(error?.message ?? "Could not start attempt")
  }

  if (proctored && !org.is_comp) {
    try {
      await consumeCredits(orgId, attempt.id, "proctored_start")
    } catch (err) {
      // Reserve failed (e.g. concurrent depletion) — roll back the attempt row.
      await supabase.from("attempts").delete().eq("id", attempt.id)
      if (err instanceof InsufficientCreditsError) {
        throw new Error(
          "This assessment is temporarily unavailable — the hiring team has no candidate credits remaining.",
        )
      }
      throw err
    }
  }

  return { attemptId: attempt.id, resumed: false }
}

export async function saveAnswer(input: {
  token: string
  attemptId: string
  questionId: string
  response: string
}): Promise<void> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const supabase = createAdminClient()
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, submitted_at")
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .maybeSingle()

  if (!attempt || attempt.submitted_at) return

  await supabase.from("answers").upsert(
    {
      attempt_id: input.attemptId,
      question_id: input.questionId,
      response: input.response,
    },
    { onConflict: "attempt_id,question_id" },
  )
}

export async function incrementTabSwitch(input: {
  token: string
  attemptId: string
}): Promise<number> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const supabase = createAdminClient()
  const { data: attempt } = await supabase
    .from("attempts")
    .select("tab_switch_count, submitted_at")
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .maybeSingle()

  if (!attempt || attempt.submitted_at) return attempt?.tab_switch_count ?? 0

  const next = (attempt.tab_switch_count ?? 0) + 1
  await supabase
    .from("attempts")
    .update({ tab_switch_count: next, flagged: next > 0 })
    .eq("id", input.attemptId)

  return next
}

/**
 * Records proctoring integrity signals for an in-progress attempt: sets the
 * device user-agent and dual-screen status once, and accumulates full-screen
 * exits, mouse-out events, and time-outside-window. No-ops once submitted.
 */
export async function recordAttemptSignals(input: {
  token: string
  attemptId: string
  userAgent?: string | null
  dualScreen?: boolean | null
  fullscreenExit?: boolean
  mouseOut?: boolean
  outsideMs?: number
}): Promise<void> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const supabase = createAdminClient()
  const { data: attempt } = await supabase
    .from("attempts")
    .select(
      "user_agent, dual_screen, fullscreen_exits, mouse_out_count, time_outside_ms, submitted_at",
    )
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .maybeSingle()

  if (!attempt || attempt.submitted_at) return

  const update: Record<string, unknown> = {}
  if (input.userAgent && !attempt.user_agent) {
    update.user_agent = input.userAgent.slice(0, 512)
  }
  if (typeof input.dualScreen === "boolean" && attempt.dual_screen === null) {
    update.dual_screen = input.dualScreen
  }
  if (input.fullscreenExit) {
    update.fullscreen_exits = (attempt.fullscreen_exits ?? 0) + 1
  }
  if (input.mouseOut) {
    update.mouse_out_count = (attempt.mouse_out_count ?? 0) + 1
  }
  if (typeof input.outsideMs === "number" && input.outsideMs > 0) {
    update.time_outside_ms =
      Number(attempt.time_outside_ms ?? 0) + Math.round(input.outsideMs)
  }

  if (Object.keys(update).length === 0) return

  await supabase
    .from("attempts")
    .update(update)
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
}

export async function recordConsent(input: {
  token: string
  attemptId: string
  version: string
  snapshot: string
  ipAddress?: string | null
}): Promise<void> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const supabase = createAdminClient()

  // Ensure the attempt actually belongs to this invite/token (prevents recording
  // consent against another org's attempt id).
  const { data: ownedAttempt } = await supabase
    .from("attempts")
    .select("id")
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .maybeSingle()
  if (!ownedAttempt) throw new Error("Attempt does not match this test link")

  const { data: existing } = await supabase
    .from("consents")
    .select("id")
    .eq("attempt_id", input.attemptId)
    .maybeSingle()

  if (existing) return

  const { error: insertError } = await supabase.from("consents").insert({
    attempt_id: input.attemptId,
    consent_text_version: input.version,
    consent_text_snapshot: input.snapshot,
    ip_address: input.ipAddress ?? null,
  })
  if (insertError) {
    throw new Error(`Failed to record consent: ${insertError.message}`)
  }
}

const PROCTORING_MEDIA_KINDS = ["camera", "screen", "face_match"] as const
type ProctoringMediaKind = (typeof PROCTORING_MEDIA_KINDS)[number]

const PROCTORING_EXTENSIONS: Record<ProctoringMediaKind, readonly string[]> = {
  camera: ["jpg", "jpeg", "png"],
  screen: ["jpg", "jpeg", "png"],
  face_match: ["jpg", "jpeg", "png"],
}

const PROCTORING_CONTENT_TYPES: Record<ProctoringMediaKind, readonly string[]> = {
  camera: ["image/jpeg", "image/png"],
  screen: ["image/jpeg", "image/png"],
  face_match: ["image/jpeg", "image/png"],
}

function validateProctoringMediaInput(input: {
  kind: string
  extension: string
  contentType: string
}): ProctoringMediaKind {
  if (!PROCTORING_MEDIA_KINDS.includes(input.kind as ProctoringMediaKind)) {
    throw new Error("Invalid proctoring media kind")
  }
  const kind = input.kind as ProctoringMediaKind
  const extension = input.extension.trim().toLowerCase()
  if (
    !extension ||
    extension.includes("/") ||
    extension.includes("\\") ||
    extension.includes("..")
  ) {
    throw new Error("Invalid proctoring media extension")
  }
  if (!PROCTORING_EXTENSIONS[kind].includes(extension)) {
    throw new Error("Invalid proctoring media extension")
  }
  const contentType = input.contentType.trim().toLowerCase()
  if (!PROCTORING_CONTENT_TYPES[kind].includes(contentType)) {
    throw new Error("Invalid proctoring media content type")
  }
  return kind
}

export async function recordProctoringMedia(input: {
  token: string
  attemptId: string
  kind: "camera" | "screen" | "face_match"
  bytes: Buffer
  contentType: string
  extension: string
  questionId?: string | null
  questionIndex?: number | null
}): Promise<string> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const kind = validateProctoringMediaInput(input)
  const extension = input.extension.trim().toLowerCase()
  const contentType = input.contentType.trim().toLowerCase()

  const supabase = createAdminClient()
  const { data: attempt, error: claimError } = await supabase
    .from("attempts")
    .update({ disposition: "under_review" })
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .eq("disposition", "under_review")
    .is("submitted_at", null)
    .select("id")
    .maybeSingle()

  if (claimError) {
    throw new Error(`Failed to claim attempt: ${claimError.message}`)
  }
  if (!attempt) {
    throw new Error("Invalid or completed attempt")
  }

  const storagePath = `${loaded.invite.id}/${input.attemptId}/${kind}-${Date.now()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from("proctoring")
    .upload(storagePath, input.bytes, {
      contentType,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to store proctoring media: ${uploadError.message}`)
  }

  // Resolve the retention window: the org's configured value (clamped to its
  // plan-tier maximum) if set, otherwise the plan-tier default. This ties how
  // long proctoring media is kept — and therefore storage cost — to the plan.
  let retentionDays: number | null = null
  const { data: testOrg } = await supabase
    .from("tests")
    .select("org_id")
    .eq("id", loaded.invite.test_id)
    .maybeSingle()
  if (testOrg?.org_id) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("data_retention_days, plan_tier, is_comp")
      .eq("id", testOrg.org_id)
      .maybeSingle()
    const tier: PlanTier = orgRow?.is_comp
      ? "custom"
      : ((orgRow?.plan_tier as PlanTier) ?? "starter")
    const policy = proctoringPolicyForTier(tier)
    const configured = (orgRow?.data_retention_days as number | null) ?? null
    retentionDays =
      configured != null
        ? Math.min(configured, policy.maxRetentionDays)
        : policy.defaultRetentionDays
  }

  const { error: rowError } = await supabase.from("proctoring_media").insert({
    attempt_id: input.attemptId,
    kind,
    storage_path: storagePath,
    expires_at: proctoringExpiresAt(new Date(), retentionDays),
    question_id: input.questionId ?? null,
    question_index: input.questionIndex ?? null,
  })

  if (rowError) {
    await supabase.storage.from("proctoring").remove([storagePath])
    throw new Error(`Failed to record proctoring media: ${rowError.message}`)
  }

  // Durable marker so the report can distinguish "purged" from "never captured"
  // after retention deletes the media row. Best-effort: the media is already
  // stored, so a marker-write hiccup must not fail the capture.
  await supabase
    .from("attempts")
    .update({ proctoring_media_captured: true })
    .eq("id", input.attemptId)

  return storagePath
}

export async function submitAttemptRecord(input: {
  token: string
  attemptId: string
  answers: Record<string, string>
  tabSwitchCount: number
  consent?: { version: string; snapshot: string }
  ipAddress?: string | null
}): Promise<{
  candidate: Candidate
  certificate: CertificateEvaluation
}> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const orgId = loaded.test.org_id!
  const org = await ensureMonthlyResetsForOrgId(orgId)

  const supabase = createAdminClient()
  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .maybeSingle()

  if (!attempt) throw new Error("Attempt not found")
  if (attempt.submitted_at) {
    const { data: consent } = await supabase
      .from("consents")
      .select("id")
      .eq("attempt_id", input.attemptId)
      .maybeSingle()
    const candidate = rowToCandidate(
      attempt as AttemptRow,
      loaded.test.id,
      consent?.id ?? null,
    )
    const certificate = await evaluateCertificateForAttempt(
      loaded.test,
      candidate,
    )
    return { candidate, certificate }
  }

  // Proctored attempts already consumed their 2 credits at start; only
  // unproctored attempts consume a credit on completion.
  const proctored = loaded.test.requires_proctoring
  if (!proctored && !org.is_comp && org.credits_remaining < 1) {
    throw new Error(
      "Submission failed — the hiring team has no candidate credits remaining.",
    )
  }

  const questions = loaded.test.questions.map((q) =>
    questionToRow(q, loaded.test.id),
  ) as QuestionRow[]

  for (const [questionId, response] of Object.entries(input.answers)) {
    const question = questions.find((q) => q.id === questionId)
    if (!question) continue

    if (question.type === "coding") {
      const graded = await gradeCodingAnswer({
        response,
        testCases: question.test_cases,
        maxPoints: question.points,
        orgId,
      })
      const { error: answerError } = await supabase.from("answers").upsert(
        {
          attempt_id: input.attemptId,
          question_id: questionId,
          response,
          is_correct: graded.isCorrect,
          points_awarded: graded.pointsAwarded,
          execution_output: graded.executionOutput,
          execution_status: graded.executionStatus,
          test_cases_passed: graded.testCasesPassed,
          test_cases_total: graded.testCasesTotal,
        },
        { onConflict: "attempt_id,question_id" },
      )
      if (answerError) {
        throw new Error(answerError.message)
      }
      continue
      continue
    }

    const graded = gradeAnswer(question, response)
    await supabase.from("answers").upsert(
      {
        attempt_id: input.attemptId,
        question_id: questionId,
        response,
        is_correct: graded.isCorrect,
        points_awarded: graded.pointsAwarded,
      },
      { onConflict: "attempt_id,question_id" },
    )
  }

  const { data: answerRows } = await supabase
    .from("answers")
    .select("*")
    .eq("attempt_id", input.attemptId)

  const score = computeScore(questions, (answerRows ?? []) as AnswerRow[])

  if (input.consent) {
    await recordConsent({
      token: input.token,
      attemptId: input.attemptId,
      version: input.consent.version,
      snapshot: input.consent.snapshot,
      ipAddress: input.ipAddress,
    })
  }

  // Consume the completion credit BEFORE finalizing the attempt so an exhausted
  // balance can never yield a free scored completion. consume_credits is
  // idempotent per (attempt_id, reason), so retries/races don't double-charge.
  if (!proctored && !org.is_comp) {
    try {
      await consumeCredits(orgId, input.attemptId, "completion")
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        throw new Error(
          "This assessment is temporarily unavailable — the hiring team has no candidate credits remaining.",
        )
      }
      throw err
    }
  }

  const now = new Date().toISOString()
  const { data: updated, error } = await supabase
    .from("attempts")
    .update({
      submitted_at: now,
      score,
      tab_switch_count: input.tabSwitchCount,
      flagged: input.tabSwitchCount > 0,
    })
    .eq("id", input.attemptId)
    .select("*")
    .single()

  if (error || !updated) throw new Error(error?.message ?? "Submit failed")

  const { data: consent } = await supabase
    .from("consents")
    .select("id")
    .eq("attempt_id", input.attemptId)
    .maybeSingle()

  const candidate = rowToCandidate(
    updated as AttemptRow,
    loaded.test.id,
    consent?.id ?? null,
  )
  const certificate = await evaluateCertificateForAttempt(loaded.test, candidate)

  void notifyTestCompletion({
    test: {
      id: loaded.test.id,
      title: loaded.test.title,
      notify_emails: loaded.test.notify_emails,
    },
    candidate,
  }).catch((err) => {
    console.error("[vertana] completion notification failed:", err)
  })

  // Auto-grading is synchronous with submission here, so the attempt is both
  // submitted and scored — emit the submission event with the final score.
  void dispatchAtsEvent(
    buildAtsEvent({
      type: "attempt.submitted",
      orgId,
      test: loaded.test,
      candidate,
      percentile: certificate.topPercent ?? null,
    }),
  ).catch((err) => console.error("[vertana] ats dispatch failed:", err))

  return { candidate, certificate }
}

export async function evaluateCertificateForAttempt(
  test: Test,
  candidate: Candidate,
): Promise<CertificateEvaluation> {
  if (
    !test.certificate_eligible ||
    candidate.score === null ||
    candidate.status !== "submitted"
  ) {
    return { qualifies: false, band: "", topPercent: 100 }
  }

  const peers = await loadCandidatesForTest(test.id)
  const submitted = peers.filter(
    (c) => c.status === "submitted" && c.score !== null,
  )
  const total = submitted.length || 1
  const higher = submitted.filter(
    (c) => (c.score as number) > (candidate.score as number),
  ).length
  const topPercent = Math.round((higher / total) * 100)
  const qualifies = topPercent <= test.certificate_percentile_threshold
  const tiers = [1, 5, 10, 25, 50]
  const tier = tiers.find((t) => topPercent <= t) ?? 100
  return { qualifies, band: `Top ${tier}%`, topPercent }
}

export async function issueCertificateRecord(input: {
  token: string
  attemptId: string
  candidateName: string
}): Promise<{ slug: string; band: string }> {
  const loaded = await loadTestByToken(input.token)
  if (!loaded) throw new Error("Invalid test link")

  const org = await getOrganizationById(loaded.test.org_id!)
  if (!org.is_comp && !certificatesEnabledForTier(org.plan_tier)) {
    throw new Error("Certificates require a Starter plan or higher.")
  }

  const supabase = createAdminClient()
  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", input.attemptId)
    .eq("test_invite_id", loaded.invite.id)
    .maybeSingle()

  if (!attempt?.submitted_at) {
    throw new Error("Attempt must be submitted before issuing a certificate")
  }

  const candidate = rowToCandidate(attempt as AttemptRow, loaded.test.id, null)
  const evaluation = await evaluateCertificateForAttempt(loaded.test, candidate)
  if (!evaluation.qualifies) {
    throw new Error("This attempt does not qualify for a certificate")
  }

  const { data: existing } = await supabase
    .from("certificates")
    .select("public_slug")
    .eq("attempt_id", input.attemptId)
    .is("revoked_at", null)
    .maybeSingle()

  if (existing?.public_slug) {
    return { slug: existing.public_slug, band: evaluation.band }
  }

  const slug = `vertana-${input.candidateName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)}-${Math.random().toString(36).slice(2, 8)}`

  const { error } = await supabase.from("certificates").insert({
    attempt_id: input.attemptId,
    candidate_name: input.candidateName.trim(),
    percentile: evaluation.topPercent,
    public_slug: slug,
  })

  if (error) throw new Error(error.message)
  return { slug, band: evaluation.band }
}

export async function loadCertificateBySlug(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("certificates")
    .select("*, attempts(candidate_email, test_invites(tests(title)))")
    .eq("public_slug", slug)
    .maybeSingle()

  if (!data || data.revoked_at) return null

  const attempt = data.attempts as {
    candidate_email: string
    test_invites: { tests: { title: string } }
  } | null

  const testTitle = attempt?.test_invites?.tests?.title ?? "Assessment"

  return {
    slug: data.public_slug,
    candidate_name: data.candidate_name,
    candidate_email: attempt?.candidate_email ?? "",
    skill_name: testTitle,
    percentile_band:
      data.percentile !== null ? `Top ${Math.round(data.percentile)}%` : "Top tier",
    issued_at: data.issued_at,
    revoked: false,
  }
}

export async function revokeCertificateRecord(input: {
  slug: string
  email: string
}): Promise<void> {
  const supabase = createAdminClient()
  const { data: cert } = await supabase
    .from("certificates")
    .select("id, attempt_id")
    .eq("public_slug", input.slug)
    .is("revoked_at", null)
    .maybeSingle()

  if (!cert) throw new Error("Certificate not found")

  const { data: attempt } = await supabase
    .from("attempts")
    .select("candidate_email")
    .eq("id", cert.attempt_id)
    .maybeSingle()

  if (
    !attempt ||
    attempt.candidate_email.toLowerCase() !== input.email.toLowerCase()
  ) {
    throw new Error("You can only revoke your own certificate")
  }

  await supabase
    .from("certificates")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", cert.id)
}

/**
 * Projects a test's questions plus an attempt's raw answer rows into the graded
 * view shape used by the results UI. Pure/in-memory — no DB access — so it can
 * be reused for both single-attempt and batched (many-attempt) loads.
 */
function buildAnswerViews(
  test: Test,
  answerRows: AnswerRow[],
): AttemptAnswerView[] {
  const answerMap = new Map(answerRows.map((a) => [a.question_id, a]))
  return test.questions.map((q) => {
    const row = questionToRow(q, test.id)
    const answer = answerMap.get(q.id)
    return {
      question_id: q.id,
      prompt: q.prompt,
      type: q.type,
      response: answer?.response ?? "",
      is_correct: answer?.is_correct ?? null,
      points_awarded: answer?.points_awarded ?? null,
      max_points: row.points,
      execution_output: answer?.execution_output ?? null,
      execution_status: answer?.execution_status ?? null,
      test_cases_passed: answer?.test_cases_passed ?? null,
      test_cases_total: answer?.test_cases_total ?? null,
      ai_suggested_points: answer?.ai_suggested_points ?? null,
      ai_suggested_rationale: answer?.ai_suggested_rationale ?? null,
    }
  })
}

export async function loadAttemptAnswers(
  testId: string,
  attemptId: string,
): Promise<AttemptAnswerView[]> {
  const test = await loadTestById(testId)
  if (!test) throw new Error("Test not found")

  const supabase = createAdminClient()
  const { data: answerRows } = await supabase
    .from("answers")
    .select("*")
    .eq("attempt_id", attemptId)

  return buildAnswerViews(test, (answerRows ?? []) as AnswerRow[])
}

/**
 * Batched sibling of {@link loadAttemptAnswers}: fetches answers for many
 * attempts of a single (already-loaded) test in a handful of chunked queries,
 * returning graded views keyed by attempt id. Replaces per-candidate loops.
 */
export async function loadAnswersForAttempts(
  test: Test,
  attemptIds: string[],
): Promise<Record<string, AttemptAnswerView[]>> {
  if (!attemptIds.length) return {}

  const supabase = createAdminClient()
  const rows = await fetchByIdsInChunks<AnswerRow>(attemptIds, (chunk) =>
    supabase.from("answers").select("*").in("attempt_id", chunk),
  )

  const byAttempt = new Map<string, AnswerRow[]>()
  for (const r of rows) {
    const list = byAttempt.get(r.attempt_id) ?? []
    list.push(r)
    byAttempt.set(r.attempt_id, list)
  }

  const out: Record<string, AttemptAnswerView[]> = {}
  for (const attemptId of attemptIds) {
    out[attemptId] = buildAnswerViews(test, byAttempt.get(attemptId) ?? [])
  }
  return out
}

/**
 * Batched consent loader for a single test: resolves many consent ids in
 * chunked queries. Since all consents belong to the given test, the test id is
 * applied directly instead of re-joining through attempts/invites per row.
 */
export async function loadConsentsForTest(
  testId: string,
  consentIds: string[],
): Promise<Record<string, ConsentRecord>> {
  if (!consentIds.length) return {}

  const supabase = createAdminClient()
  const rows = await fetchByIdsInChunks<ConsentRow>(consentIds, (chunk) =>
    supabase.from("consents").select("*").in("id", chunk),
  )

  const out: Record<string, ConsentRecord> = {}
  for (const row of rows) out[row.id] = rowToConsent(row, testId)
  return out
}

export async function updateAttemptGrades(input: {
  testId: string
  attemptId: string
  grades: Array<{
    questionId: string
    isCorrect: boolean | null
    pointsAwarded: number
  }>
}): Promise<Candidate> {
  const test = await loadTestById(input.testId)
  if (!test) throw new Error("Test not found")

  const supabase = createAdminClient()
  const questions = test.questions.map((q) => questionToRow(q, test.id)) as QuestionRow[]

  for (const grade of input.grades) {
    const { data: answer } = await supabase
      .from("answers")
      .select("response")
      .eq("attempt_id", input.attemptId)
      .eq("question_id", grade.questionId)
      .maybeSingle()

    await supabase.from("answers").upsert(
      {
        attempt_id: input.attemptId,
        question_id: grade.questionId,
        response: answer?.response ?? "",
        is_correct: grade.isCorrect,
        points_awarded: grade.pointsAwarded,
      },
      { onConflict: "attempt_id,question_id" },
    )
  }

  const { data: answerRows } = await supabase
    .from("answers")
    .select("*")
    .eq("attempt_id", input.attemptId)

  const score = computeScore(questions, (answerRows ?? []) as AnswerRow[])

  const { data: updated, error } = await supabase
    .from("attempts")
    .update({ score })
    .eq("id", input.attemptId)
    .select("*")
    .single()

  if (error || !updated) throw new Error(error?.message ?? "Could not update grades")

  const { data: consent } = await supabase
    .from("consents")
    .select("id")
    .eq("attempt_id", input.attemptId)
    .maybeSingle()

  const candidate = rowToCandidate(
    updated as AttemptRow,
    test.id,
    consent?.id ?? null,
  )

  // Manual grading finalizes/updates the score after review.
  if (test.org_id) {
    void dispatchAtsEvent(
      buildAtsEvent({
        type: "score.finalized",
        orgId: test.org_id,
        test,
        candidate,
      }),
    ).catch((err) => console.error("[vertana] ats dispatch failed:", err))
  }

  return candidate
}

export interface GradeSuggestionContext {
  prompt: string
  type: QuestionRow["type"]
  /** Expected/reference answer if the question has one, else null. */
  expected: string | null
  response: string
  maxPoints: number
  /** Cached suggestion, present once the model has been run for this answer. */
  cached: { points: number; rationale: string } | null
}

/**
 * Loads everything needed to produce (or return a cached) AI grading suggestion
 * for a single answer, scoped to the caller's org via the test id. Throws if the
 * test or question isn't found.
 */
export async function loadGradeSuggestionContext(input: {
  testId: string
  attemptId: string
  questionId: string
}): Promise<GradeSuggestionContext> {
  const test = await loadTestById(input.testId)
  if (!test) throw new Error("Test not found")
  const question = test.questions.find((q) => q.id === input.questionId)
  if (!question) throw new Error("Question not found")

  const row = questionToRow(question, test.id)
  const supabase = createAdminClient()

  // Ensure the attempt actually belongs to this test (via its invite) before
  // reading or generating a suggestion — otherwise a mismatched attemptId could
  // pull an answer from another test.
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("id, test_invites!inner(test_id)")
    .eq("id", input.attemptId)
    .maybeSingle()
  if (attemptError) throw new Error(attemptError.message)
  const invite = attempt?.test_invites as { test_id: string } | undefined
  if (!attempt || invite?.test_id !== input.testId) {
    throw new Error("Attempt not found")
  }

  const { data: answer, error: answerError } = await supabase
    .from("answers")
    .select("response, ai_suggested_points, ai_suggested_rationale, ai_suggested_at")
    .eq("attempt_id", input.attemptId)
    .eq("question_id", input.questionId)
    .maybeSingle()
  if (answerError) throw new Error(answerError.message)
  if (!answer) throw new Error("Answer not found")

  const cached =
    answer?.ai_suggested_at != null &&
    answer?.ai_suggested_points != null &&
    answer?.ai_suggested_rationale != null
      ? {
          points: Number(answer.ai_suggested_points),
          rationale: String(answer.ai_suggested_rationale),
        }
      : null

  return {
    prompt: question.prompt,
    type: question.type,
    expected: question.correct_answer_exact ?? null,
    response: String(answer.response ?? ""),
    maxPoints: row.points,
    cached,
  }
}

/** Persists an AI grading suggestion so it isn't recomputed on every view. */
export async function saveGradeSuggestion(input: {
  attemptId: string
  questionId: string
  points: number
  rationale: string
}): Promise<void> {
  const supabase = createAdminClient()
  const { data: answer, error: readError } = await supabase
    .from("answers")
    .select("id")
    .eq("attempt_id", input.attemptId)
    .eq("question_id", input.questionId)
    .maybeSingle()
  if (readError) {
    throw new Error(`Failed to load answer for grade suggestion: ${readError.message}`)
  }
  // Never fabricate/overwrite a candidate response — only cache the suggestion
  // against an existing answer row.
  if (!answer) {
    throw new Error("Answer not found")
  }

  const { error } = await supabase
    .from("answers")
    .update({
      ai_suggested_points: input.points,
      ai_suggested_rationale: input.rationale,
      ai_suggested_at: new Date().toISOString(),
    })
    .eq("attempt_id", input.attemptId)
    .eq("question_id", input.questionId)
  if (error) {
    // Surface cache-write failures — otherwise every view silently re-runs the model.
    throw new Error(`Failed to cache grade suggestion: ${error.message}`)
  }
}

export async function updateAttemptDisposition(input: {
  testId: string
  attemptId: string
  disposition: Candidate["disposition"]
}): Promise<Candidate> {
  const orgId = await getOrgId()
  const test = await loadTestById(input.testId)
  if (!test || test.org_id !== orgId) throw new Error("Test not found")

  const supabase = createAdminClient()
  const { data: attempt, error: loadError } = await supabase
    .from("attempts")
    .select("*, test_invites!inner(test_id)")
    .eq("id", input.attemptId)
    .maybeSingle()

  if (loadError || !attempt) throw new Error("Candidate not found")

  const invite = attempt.test_invites as { test_id: string }
  if (invite.test_id !== input.testId) throw new Error("Candidate not found")

  const { data: updated, error } = await supabase
    .from("attempts")
    .update({ disposition: input.disposition })
    .eq("id", input.attemptId)
    .select("*")
    .single()

  if (error || !updated) {
    throw new Error(error?.message ?? "Could not update disposition")
  }

  const { data: consent } = await supabase
    .from("consents")
    .select("id")
    .eq("attempt_id", input.attemptId)
    .maybeSingle()

  const candidate = rowToCandidate(
    updated as AttemptRow,
    test.id,
    consent?.id ?? null,
  )

  void dispatchAtsEvent(
    buildAtsEvent({
      type: "disposition.changed",
      orgId,
      test,
      candidate,
    }),
  ).catch((err) => console.error("[vertana] ats dispatch failed:", err))

  return candidate
}

export function evaluateCertificateLocal(
  test: Test,
  candidate: Candidate,
  peers: Candidate[],
): { qualifies: boolean; band: string; topPercent: number } {
  if (
    !test.certificate_eligible ||
    candidate.score === null ||
    candidate.status !== "submitted"
  ) {
    return { qualifies: false, band: "", topPercent: 100 }
  }

  const submitted = peers.filter(
    (c) => c.status === "submitted" && c.score !== null,
  )
  const total = submitted.length || 1
  const higher = submitted.filter(
    (c) => (c.score as number) > (candidate.score as number),
  ).length
  const topPercent = Math.round((higher / total) * 100)
  const qualifies = topPercent <= test.certificate_percentile_threshold
  const tiers = [1, 5, 10, 25, 50]
  const tier = tiers.find((t) => topPercent <= t) ?? 100
  return { qualifies, band: `Top ${tier}%`, topPercent }
}

/** Short-answer or coding response awaiting recruiter grading. */
export function answerNeedsManualScoring(answer: {
  type: string
  response: string
  is_correct: boolean | null
  points_awarded: number | null
}): boolean {
  if (!answer.response.trim()) return false
  if (answer.type !== "short_answer" && answer.type !== "coding") return false
  if (answer.is_correct != null && answer.points_awarded != null) return false
  return answer.is_correct === null || answer.points_awarded === null
}

/** Email invites per test (excludes the shared link row). */
export async function countInvitesByTest(
  tests?: Test[],
): Promise<Record<string, number>> {
  const resolvedTests = tests ?? (await loadTestsForOrg())
  const testIds = resolvedTests.map((t) => t.id)
  if (!testIds.length) return {}

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_invites")
    .select("test_id")
    .in("test_id", testIds)
    .eq("is_share_link", false)

  if (error) throw new Error(error.message)

  const counts = Object.fromEntries(testIds.map((id) => [id, 0]))
  for (const row of data ?? []) {
    const testId = row.test_id as string
    counts[testId] = (counts[testId] ?? 0) + 1
  }
  return counts
}

export async function loadEmailInvitesForTest(testId: string): Promise<TestInvite[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_invites")
    .select("*")
    .eq("test_id", testId)
    .eq("is_share_link", false)
    .order("email_sent_at", { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as TestInviteRow[]).map(rowToTestInvite)
}

/**
 * Records the first email open for an invite (via tracking pixel). Public,
 * token-scoped, and best-effort — only sets the timestamp when not already set.
 */
export async function markInviteOpened(token: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from("test_invites")
    .update({ email_opened_at: new Date().toISOString() })
    .eq("token", token)
    .is("email_opened_at", null)
}

/**
 * Records the first CTA click for an invite (via redirect wrapper). A click
 * implies an open, so backfill email_opened_at when it wasn't recorded.
 */
export async function markInviteClicked(token: string): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  await supabase
    .from("test_invites")
    .update({ email_clicked_at: now })
    .eq("token", token)
    .is("email_clicked_at", null)
  await supabase
    .from("test_invites")
    .update({ email_opened_at: now })
    .eq("token", token)
    .is("email_opened_at", null)
}

export interface InviteFunnelStats {
  invited: number
  opened: number
  clicked: number
}

/**
 * Email-delivery funnel counts for a single test (email invites only): how many
 * were sent, opened, and clicked. Scoped to the caller's org via loadTestById.
 */
export async function loadInviteFunnelStats(
  testId: string,
): Promise<InviteFunnelStats> {
  const test = await loadTestById(testId)
  if (!test) return { invited: 0, opened: 0, clicked: 0 }

  const supabase = createAdminClient()
  // Only successfully sent email invites count toward the funnel — pending,
  // scheduled, and failed rows never reached a candidate, so they can't be
  // opened or clicked. opened/clicked derive from this same sent-email set.
  const { data, error } = await supabase
    .from("test_invites")
    .select("email_opened_at, email_clicked_at")
    .eq("test_id", testId)
    .eq("is_share_link", false)
    .not("email_sent_at", "is", null)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  return {
    invited: rows.length,
    opened: rows.filter((r) => r.email_opened_at != null).length,
    clicked: rows.filter((r) => r.email_clicked_at != null).length,
  }
}

async function deliverCandidateInviteEmail(input: {
  inviteId: string
  to: string
  testTitle: string
  timeLimitMinutes: number
  token: string
  orgName?: string
  message?: string | null
  subject?: string | null
  replyTo?: string | null
  deadline?: string | null
}): Promise<TestInvite> {
  const supabase = createAdminClient()
  const send = await sendCandidateInviteEmail({
    to: input.to,
    testTitle: input.testTitle,
    timeLimitMinutes: input.timeLimitMinutes,
    token: input.token,
    orgName: input.orgName,
    message: input.message,
    subject: input.subject,
    replyTo: input.replyTo,
    deadline: input.deadline,
  })

  const patch = send.ok
    ? {
        email_status: "sent" as const,
        email_error: null,
        email_sent_at: new Date().toISOString(),
      }
    : {
        email_status: "failed" as const,
        email_error: send.error ?? "Email send failed",
        email_sent_at: null,
      }

  const { data, error } = await supabase
    .from("test_invites")
    .update(patch)
    .eq("id", input.inviteId)
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update invite send status")
  }

  return rowToTestInvite(data as TestInviteRow)
}

export interface CandidateInviteOptions {
  /** Per-invite deadline (ISO). Falls back to the test deadline when omitted. */
  deadlineAt?: string | null
  /** Personalized note included in the invitation email. */
  message?: string | null
  /** Overrides the default email subject. */
  subject?: string | null
  /** Reply-To address for candidate responses. */
  replyTo?: string | null
  /** When set to a future time, the email is queued instead of sent now. */
  scheduledAt?: string | null
}

function normalizeInviteOptions(options?: CandidateInviteOptions) {
  const scheduledAt =
    options?.scheduledAt && new Date(options.scheduledAt).getTime() > Date.now()
      ? new Date(options.scheduledAt).toISOString()
      : null
  return {
    deadlineAt: options?.deadlineAt
      ? new Date(options.deadlineAt).toISOString()
      : null,
    message: options?.message?.trim() || null,
    subject: options?.subject?.trim() || null,
    replyTo: options?.replyTo?.trim() || null,
    scheduledAt,
  }
}

export async function createCandidateInvite(input: {
  testId: string
  email: string
  options?: CandidateInviteOptions
}): Promise<TestInvite> {
  const test = await loadTestById(input.testId)
  if (!test) throw new Error("Test not found")
  if (test.status !== "active") {
    throw new Error("Publish this test before inviting candidates by email.")
  }

  const org = await getOrganization()
  const email = input.email.trim().toLowerCase()
  if (!email) throw new Error("Email is required")

  const opts = normalizeInviteOptions(input.options)
  // Fall back to the org-wide default reply-to when the caller didn't set one.
  const replyTo = opts.replyTo ?? org?.default_reply_to ?? null

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("test_invites")
    .select("id, status")
    .eq("test_id", input.testId)
    .eq("is_share_link", false)
    .ilike("candidate_email", email)
    .neq("status", "revoked")
    .maybeSingle()

  if (existing) {
    throw new Error("An invite already exists for this email on this assessment.")
  }

  const token = generateToken()
  const { data: invite, error } = await supabase
    .from("test_invites")
    .insert({
      test_id: input.testId,
      candidate_email: email,
      token,
      is_share_link: false,
      status: "active",
      email_status: opts.scheduledAt ? "scheduled" : "pending",
      expires_at: opts.deadlineAt,
      scheduled_at: opts.scheduledAt,
      email_subject: opts.subject,
      email_message: opts.message,
      email_reply_to: replyTo,
    })
    .select("*")
    .single()

  if (error || !invite) {
    throw new Error(error?.message ?? "Could not create invite")
  }

  // Queued for a future send — the cron processor will deliver it.
  if (opts.scheduledAt) {
    return rowToTestInvite(invite as TestInviteRow)
  }

  return deliverCandidateInviteEmail({
    inviteId: invite.id as string,
    to: email,
    testTitle: test.title,
    timeLimitMinutes: test.time_limit_minutes,
    token,
    orgName: org?.name,
    message: opts.message,
    subject: opts.subject,
    replyTo,
    deadline: opts.deadlineAt ?? test.deadline,
  })
}

export interface BulkInviteResult {
  email: string
  ok: boolean
  invite?: TestInvite
  error?: string
}

/** Max invites created in parallel per bulk request. */
const BULK_INVITE_CONCURRENCY = 5

/** Invite many candidates at once; each email succeeds or fails independently. */
export async function createCandidateInvitesBulk(input: {
  testId: string
  emails: string[]
  options?: CandidateInviteOptions
}): Promise<BulkInviteResult[]> {
  // De-duplicate normalized emails up front so each candidate is invited once.
  const seen = new Set<string>()
  const emails: string[] = []
  for (const raw of input.emails) {
    const email = raw.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    emails.push(email)
  }

  // Process with a fixed-size worker pool: bounded concurrency, results kept in
  // input order so the response lines up with what the recruiter submitted.
  const results: BulkInviteResult[] = new Array(emails.length)
  let cursor = 0
  async function worker() {
    while (true) {
      const index = cursor++
      if (index >= emails.length) return
      const email = emails[index]
      try {
        const invite = await createCandidateInvite({
          testId: input.testId,
          email,
          options: input.options,
        })
        results[index] = { email, ok: true, invite }
      } catch (err) {
        results[index] = { email, ok: false, error: (err as Error).message }
      }
    }
  }

  const workerCount = Math.min(BULK_INVITE_CONCURRENCY, emails.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return results
}

/** Revoke an email invite so its personal link no longer grants access. */
export async function revokeCandidateInvite(inviteId: string): Promise<TestInvite> {
  const supabase = createAdminClient()
  const orgId = await getOrgId()

  const { data: invite, error } = await supabase
    .from("test_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("is_share_link", false)
    .maybeSingle()

  if (error || !invite) throw new Error("Invite not found")

  const test = await loadTestById(invite.test_id as string)
  if (!test || test.org_id !== orgId) throw new Error("Invite not found")

  const { data: updated, error: updateError } = await supabase
    .from("test_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .select("*")
    .single()

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Could not revoke invite")
  }

  return rowToTestInvite(updated as TestInviteRow)
}

/**
 * Deliver any scheduled invites whose send time has passed. Invoked by the cron
 * endpoint; runs with the service-role client and is not org-scoped.
 */
export async function processScheduledInvites(
  limit = 100,
): Promise<{ processed: number; sent: number; failed: number }> {
  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data: due, error } = await supabase
    .from("test_invites")
    .select("*")
    .eq("is_share_link", false)
    .eq("email_status", "scheduled")
    .eq("status", "active")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)

  const rows = (due ?? []) as TestInviteRow[]
  let sent = 0
  let failed = 0

  for (const row of rows) {
    // Atomically claim the invite: flip scheduled → pending only if it's still
    // scheduled. If another concurrent run already claimed it, skip delivery so
    // the same email isn't sent twice.
    const { data: claimed } = await supabase
      .from("test_invites")
      .update({ email_status: "pending", email_error: null })
      .eq("id", row.id)
      .eq("email_status", "scheduled")
      .select("id")

    if (!claimed || claimed.length === 0) {
      continue
    }

    const { data: testRow } = await supabase
      .from("tests")
      .select("*")
      .eq("id", row.test_id)
      .maybeSingle()

    // Skip (and clear the schedule) if the test is gone or no longer active.
    if (!testRow || (testRow as TestRow).status !== "active") {
      await supabase
        .from("test_invites")
        .update({
          email_status: "failed",
          email_error: "Test is not active at scheduled send time.",
        })
        .eq("id", row.id)
      failed += 1
      continue
    }

    const test = testRow as TestRow
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", test.org_id)
      .maybeSingle()

    const result = await deliverCandidateInviteEmail({
      inviteId: row.id,
      to: row.candidate_email ?? "",
      testTitle: test.title,
      timeLimitMinutes: Math.round(test.time_limit_seconds / 60),
      token: row.token,
      orgName: (org as { name?: string } | null)?.name,
      message: row.email_message,
      subject: row.email_subject,
      replyTo: row.email_reply_to,
      deadline: row.expires_at ?? test.deadline,
    })

    if (result.email_status === "sent") sent += 1
    else failed += 1
  }

  return { processed: rows.length, sent, failed }
}

/** Hours after an invite is sent before we nudge a candidate who hasn't started. */
const REMINDER_NOT_STARTED_AFTER_HOURS = 48
/** Hours before the deadline when we send the "closes soon" reminder. */
const REMINDER_DEADLINE_WITHIN_HOURS = 24

type InviteWithTest = TestInviteRow & {
  tests: {
    title: string
    time_limit_seconds: number
    status: TestStatus
    deadline: string | null
    org_id: string
  } | null
}

/** Effective deadline for an invite: its own expiry, else the test's deadline. */
function inviteDeadline(row: InviteWithTest): string | null {
  return row.expires_at ?? row.tests?.deadline ?? null
}

/**
 * Send candidate invite reminders. Two independent one-shot nudges:
 *   1. "not started" — 48h after the invite was emailed, if no attempt started.
 *   2. "deadline" — within 24h of the deadline, if not yet submitted.
 * Invoked by the reminder cron; runs with the service-role client (not scoped).
 */
export async function processInviteReminders(
  limit = 100,
): Promise<{ notStartedSent: number; deadlineSent: number; failed: number }> {
  const supabase = createAdminClient()
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const testSelect =
    "*, tests!inner(title, time_limit_seconds, status, deadline, org_id)"

  let notStartedSent = 0
  let deadlineSent = 0
  let failed = 0

  // Cache org names so a batch of invites for one org needs a single lookup.
  const orgNameCache = new Map<string, string | undefined>()
  async function orgName(orgId: string): Promise<string | undefined> {
    if (orgNameCache.has(orgId)) return orgNameCache.get(orgId)
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .maybeSingle()
    const name = (data as { name?: string } | null)?.name
    orgNameCache.set(orgId, name)
    return name
  }

  // Has this invite been started / submitted? Returns flags per invite id.
  async function attemptFlags(
    inviteIds: string[],
  ): Promise<Map<string, { started: boolean; submitted: boolean }>> {
    const map = new Map<string, { started: boolean; submitted: boolean }>()
    if (inviteIds.length === 0) return map
    const { data } = await supabase
      .from("attempts")
      .select("test_invite_id, started_at, submitted_at")
      .in("test_invite_id", inviteIds)
    for (const a of (data ?? []) as {
      test_invite_id: string
      started_at: string | null
      submitted_at: string | null
    }[]) {
      const prev = map.get(a.test_invite_id) ?? {
        started: false,
        submitted: false,
      }
      map.set(a.test_invite_id, {
        started: prev.started || a.started_at !== null,
        submitted: prev.submitted || a.submitted_at !== null,
      })
    }
    return map
  }

  async function sendReminder(
    row: InviteWithTest,
    kind: "not_started" | "deadline",
  ): Promise<boolean> {
    const column =
      kind === "not_started" ? "reminder_not_started_at" : "reminder_deadline_at"

    // Atomically claim so concurrent runs don't double-send this reminder.
    // Reassert status = 'active' so revoked invites aren't sent after fetch.
    const { data: claimed } = await supabase
      .from("test_invites")
      .update({ [column]: nowIso })
      .eq("id", row.id)
      .eq("status", "active")
      .is(column, null)
      .select("id")
    if (!claimed || claimed.length === 0) return false

    // Release the claim so a later cron run can retry.
    async function releaseClaim(): Promise<void> {
      await supabase
        .from("test_invites")
        .update({ [column]: null })
        .eq("id", row.id)
    }

    const test = row.tests
    if (!test) {
      await releaseClaim()
      return false
    }
    const result = await sendCandidateReminderEmail({
      kind,
      to: row.candidate_email ?? "",
      testTitle: test.title,
      timeLimitMinutes: Math.round(test.time_limit_seconds / 60),
      token: row.token,
      orgName: await orgName(test.org_id),
      replyTo: row.email_reply_to,
      deadline: inviteDeadline(row),
    })
    if (!result.ok) await releaseClaim()
    return result.ok
  }

  // --- Reminder 1: invited but not started, 48h after send ---
  const notStartedCutoff = new Date(
    now - REMINDER_NOT_STARTED_AFTER_HOURS * 3600_000,
  ).toISOString()
  const { data: notStartedRows } = await supabase
    .from("test_invites")
    .select(testSelect)
    .eq("is_share_link", false)
    .eq("status", "active")
    .eq("email_status", "sent")
    .is("reminder_not_started_at", null)
    .lte("email_sent_at", notStartedCutoff)
    .limit(limit)

  const nsRows = (notStartedRows ?? []) as unknown as InviteWithTest[]
  const nsFlags = await attemptFlags(nsRows.map((r) => r.id))
  for (const row of nsRows) {
    if (row.tests?.status !== "active") continue
    // Don't nudge to start if the deadline has already passed.
    const deadline = inviteDeadline(row)
    if (deadline && new Date(deadline).getTime() <= now) continue
    if (nsFlags.get(row.id)?.started) continue
    const ok = await sendReminder(row, "not_started")
    if (ok) notStartedSent += 1
    else failed += 1
  }

  // --- Reminder 2: deadline within 24h and not submitted ---
  const { data: deadlineRows } = await supabase
    .from("test_invites")
    .select(testSelect)
    .eq("is_share_link", false)
    .eq("status", "active")
    .eq("email_status", "sent")
    .is("reminder_deadline_at", null)
    // Prioritize imminent reminders by effective deadline. expires_at is the
    // primary component of inviteDeadline(); order by it (soonest first, nulls
    // last) so the limit keeps the most urgent invites.
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(limit)

  const dlRows = (deadlineRows ?? []) as unknown as InviteWithTest[]
  const windowEnd = now + REMINDER_DEADLINE_WITHIN_HOURS * 3600_000
  const dueForDeadline = dlRows.filter((row) => {
    if (row.tests?.status !== "active") return false
    const deadline = inviteDeadline(row)
    if (!deadline) return false
    const ts = new Date(deadline).getTime()
    return ts > now && ts <= windowEnd
  })
  const dlFlags = await attemptFlags(dueForDeadline.map((r) => r.id))
  for (const row of dueForDeadline) {
    if (dlFlags.get(row.id)?.submitted) continue
    const ok = await sendReminder(row, "deadline")
    if (ok) deadlineSent += 1
    else failed += 1
  }

  return { notStartedSent, deadlineSent, failed }
}

export async function resendCandidateInvite(inviteId: string): Promise<TestInvite> {
  const supabase = createAdminClient()
  const orgId = await getOrgId()

  const { data: invite, error } = await supabase
    .from("test_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("is_share_link", false)
    .maybeSingle()

  if (error || !invite) throw new Error("Invite not found")

  const test = await loadTestById(invite.test_id as string)
  if (!test || test.org_id !== orgId) throw new Error("Invite not found")

  await supabase
    .from("test_invites")
    .update({ email_status: "pending", email_error: null })
    .eq("id", inviteId)

  const org = await getOrganization()
  const row = invite as TestInviteRow
  return deliverCandidateInviteEmail({
    inviteId,
    to: (invite.candidate_email as string) ?? "",
    testTitle: test.title,
    timeLimitMinutes: test.time_limit_minutes,
    token: invite.token as string,
    orgName: org?.name,
    message: row.email_message,
    subject: row.email_subject,
    replyTo: row.email_reply_to,
    deadline: row.expires_at ?? test.deadline,
  })
}

/** Ungraded manual answers per test (answer count, not attempt count). */
export async function countNeedsScoringByTest(
  tests?: Test[],
): Promise<Record<string, number>> {
  const resolvedTests = tests ?? (await loadTestsForOrg())
  const testIds = resolvedTests.map((t) => t.id)
  if (!testIds.length) return {}

  const supabase = createAdminClient()

  // Question type per id — the only bit of the question needed to decide whether
  // an answer requires manual grading. Sourced from the already-loaded tests.
  const questionType = new Map<string, string>()
  for (const test of resolvedTests) {
    for (const q of test.questions) questionType.set(q.id, q.type)
  }

  const inviteRows = await fetchByIdsInChunks<{ id: string; test_id: string }>(
    testIds,
    (chunk) =>
      supabase.from("test_invites").select("id, test_id").in("test_id", chunk),
  )
  const testIdByInvite = new Map<string, string>()
  for (const inv of inviteRows) testIdByInvite.set(inv.id, inv.test_id)
  const inviteIds = [...testIdByInvite.keys()]
  if (!inviteIds.length) return {}

  const attempts = await fetchByIdsInChunks<AttemptRow>(inviteIds, (chunk) =>
    supabase.from("attempts").select("*").in("test_invite_id", chunk),
  )

  // Only submitted attempts count toward manual-scoring backlog.
  const testIdByAttempt = new Map<string, string>()
  for (const row of attempts) {
    if (attemptStatus(row) !== "submitted") continue
    const testId = testIdByInvite.get(row.test_invite_id)
    if (testId) testIdByAttempt.set(row.id, testId)
  }
  const attemptIds = [...testIdByAttempt.keys()]
  if (!attemptIds.length) return {}

  const answers = await fetchByIdsInChunks<
    Pick<
      AnswerRow,
      "attempt_id" | "question_id" | "response" | "is_correct" | "points_awarded"
    >
  >(attemptIds, (chunk) =>
    supabase
      .from("answers")
      .select("attempt_id, question_id, response, is_correct, points_awarded")
      .in("attempt_id", chunk),
  )

  const counts: Record<string, number> = {}
  for (const a of answers) {
    const testId = testIdByAttempt.get(a.attempt_id)
    if (!testId) continue
    const type = questionType.get(a.question_id)
    if (!type) continue
    const needs = answerNeedsManualScoring({
      type,
      response: a.response ?? "",
      is_correct: a.is_correct,
      points_awarded: a.points_awarded,
    })
    if (needs) counts[testId] = (counts[testId] ?? 0) + 1
  }

  return counts
}
