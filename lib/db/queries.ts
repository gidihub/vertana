import {
  computeScore,
  generateToken,
  gradeAnswer,
  questionToRow,
  rowToCandidate,
  rowToConsent,
  rowToQuestion,
  rowToTest,
  rowToTestInvite,
  type AnswerRow,
  type AttemptRow,
  type QuestionRow,
  type TestInviteRow,
  type TestRow,
} from "@/lib/db/mappers"
import { gradeCodingAnswer } from "@/lib/execution/grade-coding"
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
import { sendCandidateInviteEmail } from "@/lib/notifications/candidate-invite-email"
import { createAdminClient } from "@/lib/supabase/admin"
import { proctoringExpiresAt } from "@/lib/proctoring/retention"
import type { Candidate, ConsentRecord, Test, TestInvite } from "@/lib/types"

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

export async function loadTestsForOrg(): Promise<Test[]> {
  const orgId = await getOrgId()
  const supabase = createAdminClient()

  const { data: tests, error } = await supabase
    .from("tests")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  if (!tests?.length) return []

  const testIds = tests.map((t) => t.id)
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .in("test_id", testIds)
    .order("order_index", { ascending: true })

  const { data: invites } = await supabase
    .from("test_invites")
    .select("*")
    .in("test_id", testIds)
    .eq("is_share_link", true)

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
    !proctoringEnabledForTier(org.plan_tier as PlanTier)
  ) {
    throw new Error(
      "Proctoring is available on paid plans only. Upgrade to Starter or higher to enable proctoring, or turn it off to save this test.",
    )
  }

  if (test.status === "active") {
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

export async function loadAllCandidates(): Promise<Candidate[]> {
  const tests = await loadTestsForOrg()
  const all: Candidate[] = []
  for (const test of tests) {
    const candidates = await loadCandidatesForTest(test.id)
    all.push(...candidates)
  }
  return all
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
    return { attemptId: existing.id, resumed: true }
  }

  // Proctoring is a paid feature. If the org has since downgraded to Free while
  // proctored tests still exist, block new attempts rather than silently running
  // them unproctored. (Existing in-progress attempts above are allowed to resume.)
  if (proctored && !proctoringEnabledForTier(org.plan_tier as PlanTier)) {
    throw new Error(
      "This proctored assessment is temporarily unavailable — the hiring team needs to upgrade their plan to run it.",
    )
  }

  // Only new attempts reserve credits: proctored attempts reserve 2 at start
  // (recording begins now); unproctored attempts reserve nothing until submit.
  const requiredAtStart = proctored ? 2 : 1
  if (org.credits_remaining < requiredAtStart) {
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

  if (proctored) {
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

  const { error: rowError } = await supabase.from("proctoring_media").insert({
    attempt_id: input.attemptId,
    kind,
    storage_path: storagePath,
    expires_at: proctoringExpiresAt(),
  })

  if (rowError) {
    await supabase.storage.from("proctoring").remove([storagePath])
    throw new Error(`Failed to record proctoring media: ${rowError.message}`)
  }

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
  if (!proctored && org.credits_remaining < 1) {
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
  if (!proctored) {
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
  if (!certificatesEnabledForTier(org.plan_tier)) {
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

  const answerMap = new Map(
    ((answerRows ?? []) as AnswerRow[]).map((a) => [a.question_id, a]),
  )

  return test.questions.map((q) => {
    const row = questionToRow(q, testId)
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
    }
  })
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

  return rowToCandidate(
    updated as AttemptRow,
    test.id,
    consent?.id ?? null,
  )
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

  return rowToCandidate(
    updated as AttemptRow,
    test.id,
    consent?.id ?? null,
  )
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
export async function countInvitesByTest(): Promise<Record<string, number>> {
  const tests = await loadTestsForOrg()
  const testIds = tests.map((t) => t.id)
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

async function deliverCandidateInviteEmail(input: {
  inviteId: string
  to: string
  testTitle: string
  timeLimitMinutes: number
  token: string
  orgName?: string
}): Promise<TestInvite> {
  const supabase = createAdminClient()
  const send = await sendCandidateInviteEmail({
    to: input.to,
    testTitle: input.testTitle,
    timeLimitMinutes: input.timeLimitMinutes,
    token: input.token,
    orgName: input.orgName,
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

export async function createCandidateInvite(input: {
  testId: string
  email: string
}): Promise<TestInvite> {
  const test = await loadTestById(input.testId)
  if (!test) throw new Error("Test not found")
  if (test.status !== "active") {
    throw new Error("Publish this test before inviting candidates by email.")
  }

  const org = await getOrganization()
  const email = input.email.trim().toLowerCase()
  if (!email) throw new Error("Email is required")

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
      email_status: "pending",
    })
    .select("*")
    .single()

  if (error || !invite) {
    throw new Error(error?.message ?? "Could not create invite")
  }

  return deliverCandidateInviteEmail({
    inviteId: invite.id as string,
    to: email,
    testTitle: test.title,
    timeLimitMinutes: test.time_limit_minutes,
    token,
    orgName: org?.name,
  })
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
  return deliverCandidateInviteEmail({
    inviteId,
    to: (invite.candidate_email as string) ?? "",
    testTitle: test.title,
    timeLimitMinutes: test.time_limit_minutes,
    token: invite.token as string,
    orgName: org?.name,
  })
}

/** Ungraded manual answers per test (answer count, not attempt count). */
export async function countNeedsScoringByTest(): Promise<Record<string, number>> {
  const tests = await loadTestsForOrg()
  const counts: Record<string, number> = {}

  for (const test of tests) {
    const candidates = await loadCandidatesForTest(test.id)
    const submitted = candidates.filter((c) => c.status === "submitted")
    let need = 0

    for (const candidate of submitted) {
      const answers = await loadAttemptAnswers(test.id, candidate.id)
      need += answers.filter(answerNeedsManualScoring).length
    }

    if (need > 0) counts[test.id] = need
  }

  return counts
}
