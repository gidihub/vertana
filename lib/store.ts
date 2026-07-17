"use client"

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"

import type {
  AiResistance,
  Candidate,
  Certificate,
  ConsentRecord,
  LibraryCategory,
  Organization,
  Question,
  Test,
  TestStatus,
} from "@/lib/types"
import type { SessionPlaybackModel } from "@/lib/candidates/session-playback"

export type { SessionPlaybackModel } from "@/lib/candidates/session-playback"

export function uid(): string {
  return crypto.randomUUID()
}

interface DB {
  tests: Test[]
  candidates: Candidate[]
  inviteCounts: Record<string, number>
  needsScoring: Record<string, number>
  emailFunnel: { invited: number; opened: number; clicked: number }
  consents: Record<string, ConsentRecord>
  organization: Organization | null
  loading: boolean
  error: string | null
}

const emptyDb: DB = {
  tests: [],
  candidates: [],
  inviteCounts: {},
  needsScoring: {},
  emailFunnel: { invited: 0, opened: 0, clicked: 0 },
  consents: {},
  organization: null,
  loading: true,
  error: null,
}

let db: DB = { ...emptyDb }
const listeners = new Set<() => void>()
let version = 0
let fetchPromise: Promise<void> | null = null

function emit() {
  version++
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network request failed"
    throw new Error(
      message === "Load failed" || message === "Failed to fetch"
        ? "Could not reach the server — check your connection and that the dev server is running."
        : message,
    )
  }
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Request failed")
  }
  return data as T
}

export async function refreshStore(): Promise<void> {
  if (fetchPromise) return fetchPromise

  fetchPromise = (async () => {
    try {
      const [dashboard, orgRes] = await Promise.all([
        api<{
          tests: Test[]
          candidates: Candidate[]
          needs_scoring: Record<string, number>
          invite_counts: Record<string, number>
          email_funnel?: { invited: number; opened: number; clicked: number }
        }>("/api/tests"),
        api<{ organization: Organization }>("/api/org"),
      ])

      db = {
        tests: dashboard.tests,
        candidates: dashboard.candidates,
        inviteCounts: dashboard.invite_counts ?? {},
        needsScoring: dashboard.needs_scoring ?? {},
        emailFunnel: dashboard.email_funnel ?? {
          invited: 0,
          opened: 0,
          clicked: 0,
        },
        consents: {},
        organization: orgRes.organization,
        loading: false,
        error: null,
      }
    } catch (err) {
      db = {
        ...db,
        loading: false,
        error: (err as Error).message,
      }
    } finally {
      fetchPromise = null
      emit()
    }
  })()

  return fetchPromise
}

export function getTests(): Test[] {
  return [...db.tests].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getTest(id: string): Test | undefined {
  return db.tests.find((t) => t.id === id)
}

export function getTestByToken(token: string): Test | undefined {
  return db.tests.find((t) => t.token === token)
}

export function getCandidatesForTest(testId: string): Candidate[] {
  return db.candidates.filter((c) => c.test_id === testId)
}

export function getConsent(id: string | null): ConsentRecord | undefined {
  if (!id) return undefined
  return db.consents[id]
}

export function candidateCount(testId: string): number {
  return db.candidates.filter((c) => c.test_id === testId).length
}

export async function saveTest(test: Test): Promise<Test> {
  const isNew = !db.tests.some((t) => t.id === test.id)
  const data = await api<{ test: Test }>(
    isNew ? "/api/tests" : `/api/tests/${test.id}`,
    {
      method: isNew ? "POST" : "PUT",
      body: JSON.stringify(test),
    },
  )
  await refreshStore()
  return data.test
}

export async function setTestStatus(id: string, status: TestStatus): Promise<void> {
  await api(`/api/tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  await refreshStore()
}

export async function setTestPinned(id: string, isPinned: boolean): Promise<void> {
  await api(`/api/tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_pinned: isPinned }),
  })
  await refreshStore()
}

export async function deleteTest(id: string): Promise<void> {
  await api(`/api/tests/${id}`, { method: "DELETE" })
  await refreshStore()
}

export interface InviteFunnelStats {
  invited: number
  opened: number
  clicked: number
}

export async function loadTestResults(testId: string): Promise<{
  test: Test
  candidates: Candidate[]
  consents: Record<string, ConsentRecord>
  answers: Record<string, AttemptAnswerView[]>
  inviteStats: InviteFunnelStats
}> {
  const data = await api<{
    test: Test
    candidates: Candidate[]
    consents: Record<string, ConsentRecord>
    answers: Record<string, AttemptAnswerView[]>
    inviteStats: InviteFunnelStats
  }>(`/api/tests/${testId}/results`)

  db = {
    ...db,
    tests: db.tests.some((t) => t.id === testId)
      ? db.tests.map((t) => (t.id === testId ? data.test : t))
      : [...db.tests, data.test],
    candidates: [
      ...db.candidates.filter((c) => c.test_id !== testId),
      ...data.candidates,
    ],
    consents: { ...db.consents, ...data.consents },
  }
  emit()
  return data
}

export interface ProctoringMediaView {
  id: string
  kind: "camera" | "screen" | "face_match"
  created_at: string
  expires_at: string
  url: string | null
  question_id: string | null
  question_index: number | null
}

export async function loadProctoringMedia(
  testId: string,
  attemptId: string,
): Promise<ProctoringMediaView[]> {
  const data = await api<{ media: ProctoringMediaView[] }>(
    `/api/tests/${testId}/results/${attemptId}/proctoring`,
  )
  return data.media
}

/**
 * Loads the "Session playback" model (camera frames joined to the per-question
 * timing log) for an attempt. Signed camera URLs are built server-side, so this
 * is only called when the recruiter expands the playback card.
 */
export async function loadSessionPlayback(
  testId: string,
  attemptId: string,
): Promise<SessionPlaybackModel> {
  const data = await api<{ playback: SessionPlaybackModel }>(
    `/api/tests/${testId}/results/${attemptId}/session-playback`,
  )
  return data.playback
}

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
  /** Whether a per-question timing log exists (gates the Session playback card). */
  hasQuestionTimeline: boolean
}

export interface CandidateProfileData {
  email: string
  attempts: CandidateAttemptDetail[]
}

export async function loadCandidateProfile(
  email: string,
): Promise<CandidateProfileData> {
  const data = await api<{ profile: CandidateProfileData }>(
    `/api/candidates/${encodeURIComponent(email)}`,
  )
  return data.profile
}

export interface AttemptAnswerView {
  question_id: string
  prompt: string
  type: Question["type"]
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

export async function fetchLibraryQuestions(filters?: {
  category?: string | ""
  search?: string
  ai_resistance?: AiResistance | ""
}): Promise<Question[]> {
  const params = new URLSearchParams()
  if (filters?.category) params.set("category", filters.category)
  if (filters?.search) params.set("search", filters.search)
  if (filters?.ai_resistance) params.set("ai_resistance", filters.ai_resistance)
  const qs = params.toString()
  const data = await api<{ questions: Question[] }>(
    `/api/question-library${qs ? `?${qs}` : ""}`,
  )
  return data.questions
}

export async function fetchTestById(id: string): Promise<Test | null> {
  const data = await api<{ test: Test }>(`/api/tests/${id}`)
  return data.test
}

export interface ProctoringPolicyView {
  intervalMs: number
  maxSnapshots: number
  screenRecording: boolean
}

export async function fetchTestByToken(token: string): Promise<{
  test: Test
  proctoringPolicy: ProctoringPolicyView | null
}> {
  const data = await api<{
    test: Test
    proctoringPolicy: ProctoringPolicyView | null
  }>(`/api/candidate/${token}`)
  return { test: data.test, proctoringPolicy: data.proctoringPolicy ?? null }
}

export async function checkCandidateStatus(
  token: string,
  email: string,
): Promise<{
  status: "new" | "in_progress" | "submitted"
  attemptId?: string
  submittedAt?: string
}> {
  const params = new URLSearchParams({ email })
  return api(`/api/candidate/${token}/status?${params}`)
}

export async function loadResumeAttempt(input: {
  token: string
  attemptId: string
  email: string
}): Promise<{
  answers: Record<string, string>
  tabSwitchCount: number
  startedAt: string | null
}> {
  const params = new URLSearchParams({
    attemptId: input.attemptId,
    email: input.email,
  })
  return api(`/api/candidate/${input.token}/attempt?${params}`)
}

export async function startCandidateAttempt(
  token: string,
  email: string,
): Promise<{ attemptId: string; resumed: boolean }> {
  return api<{ attemptId: string; resumed: boolean }>(
    `/api/candidate/${token}/start`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  )
}

export async function autosaveAnswer(input: {
  token: string
  attemptId: string
  questionId: string
  response: string
}): Promise<void> {
  await api(`/api/candidate/${input.token}/answers`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export async function reportTabSwitch(
  token: string,
  attemptId: string,
): Promise<number> {
  const data = await api<{ tabSwitchCount: number }>(
    `/api/candidate/${token}/tab-switch`,
    {
      method: "POST",
      body: JSON.stringify({ attemptId }),
    },
  )
  return data.tabSwitchCount
}

export interface ProctoringSignalInput {
  attemptId: string
  userAgent?: string
  dualScreen?: boolean
  fullscreenExit?: boolean
  mouseOut?: boolean
  outsideMs?: number
}

/**
 * Fire-and-forget proctoring signal. Uses keepalive so it still flushes during
 * page unload; failures are swallowed so tracking never disrupts the candidate.
 */
export function reportProctoringSignal(
  token: string,
  payload: ProctoringSignalInput,
): void {
  try {
    // Attach a catch so a rejected fetch (network drop, unload) never surfaces
    // as an unhandled promise rejection; tracking must stay invisible.
    void fetch(`/api/candidate/${token}/signals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // best-effort
  }
}

export interface QuestionViewInput {
  attemptId: string
  questionId: string
  enteredAt: string
  leftAt?: string | null
  answer?: string | null
  answerChangeCount?: number
}

/**
 * Fire-and-forget per-question timing event for the Session playback log. Same
 * best-effort contract as {@link reportProctoringSignal}: uses keepalive so it
 * flushes during navigation/unload, and swallows failures so a telemetry write
 * can never block the candidate's answer submission.
 */
export function reportQuestionView(
  token: string,
  payload: QuestionViewInput,
): void {
  try {
    void fetch(`/api/candidate/${token}/question-views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // best-effort
  }
}

interface SubmitAttemptInput {
  token: string
  attemptId: string
  answers: Record<string, string>
  tabSwitchCount: number
  consent?: { version: string; snapshot: string }
}

export async function submitAttempt(input: SubmitAttemptInput): Promise<{
  candidate: Candidate
  certificate: CertificateEvaluation
}> {
  const data = await api<{
    candidate: Candidate
    certificate: CertificateEvaluation
  }>(`/api/candidate/${input.token}/submit`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  await refreshStore()
  return data
}

export interface CertificateEvaluation {
  qualifies: boolean
  band: string
  topPercent: number
}

export async function gradeAttempt(input: {
  testId: string
  attemptId: string
  grades: Array<{
    questionId: string
    isCorrect: boolean | null
    pointsAwarded: number
  }>
}): Promise<Candidate> {
  const data = await api<{ candidate: Candidate }>(
    `/api/tests/${input.testId}/results/${input.attemptId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ grades: input.grades }),
    },
  )
  await refreshStore()
  return data.candidate
}

export interface GradeSuggestion {
  suggestedScore: number
  rationale: string
  maxPoints: number
  cached: boolean
}

export async function fetchGradeSuggestion(input: {
  testId: string
  attemptId: string
  questionId: string
}): Promise<GradeSuggestion> {
  return api<GradeSuggestion>(
    `/api/tests/${input.testId}/results/${input.attemptId}/grade-suggestion`,
    {
      method: "POST",
      body: JSON.stringify({ questionId: input.questionId }),
    },
  )
}

export async function updateCandidateDisposition(input: {
  testId: string
  attemptId: string
  disposition: Candidate["disposition"]
}): Promise<Candidate> {
  const data = await api<{ candidate: Candidate }>(
    `/api/tests/${input.testId}/results/${input.attemptId}/disposition`,
    {
      method: "PATCH",
      body: JSON.stringify({ disposition: input.disposition }),
    },
  )
  db = {
    ...db,
    candidates: db.candidates.map((c) =>
      c.id === input.attemptId ? data.candidate : c,
    ),
  }
  emit()
  return data.candidate
}

interface IssueCertificateInput {
  token: string
  attemptId: string
  candidateName: string
  percentile?: number
}

export async function issueCertificate(
  input: IssueCertificateInput,
): Promise<Certificate> {
  const data = await api<{ slug: string; band: string }>(
    `/api/candidate/${input.token}/certificate`,
    {
      method: "POST",
      body: JSON.stringify({
        attemptId: input.attemptId,
        candidateName: input.candidateName,
      }),
    },
  )

  return {
    id: uid(),
    slug: data.slug,
    attempt_id: input.attemptId,
    candidate_name: input.candidateName.trim(),
    candidate_email: "",
    test_id: "",
    skill_name: "",
    percentile_band: data.band,
    issued_at: new Date().toISOString(),
    revoked: false,
  }
}

export async function revokeCertificate(input: {
  slug: string
  email: string
}): Promise<void> {
  await api(`/api/certificates/${input.slug}`, {
    method: "DELETE",
    body: JSON.stringify({ email: input.email }),
  })
}

export async function fetchCertificateBySlug(
  slug: string,
): Promise<Certificate | null> {
  try {
    const data = await api<{ certificate: Certificate }>(
      `/api/certificates/${slug}`,
    )
    return {
      id: uid(),
      slug: data.certificate.slug,
      candidate_name: data.certificate.candidate_name,
      candidate_email: data.certificate.candidate_email,
      test_id: "",
      skill_name: data.certificate.skill_name,
      percentile_band: data.certificate.percentile_band,
      issued_at: data.certificate.issued_at,
      revoked: data.certificate.revoked,
    }
  } catch {
    return null
  }
}

export function useStore<T>(selector: (db: DB) => T): T {
  const cache = useRef<{ version: number; value: T } | null>(null)

  const getSnapshot = useCallback(() => {
    if (cache.current === null || cache.current.version !== version) {
      cache.current = { version, value: selector(db) }
    }
    return cache.current.value
  }, [selector])

  useEffect(() => {
    if (db.loading && !fetchPromise) {
      void refreshStore()
    }
  }, [])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useNeedsScoring(): Record<string, number> {
  return useStore((db) => db.needsScoring)
}

export function useOrganization(): Organization | null {
  return useStore((state) => state.organization)
}
