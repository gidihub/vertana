"use client"

// ---------------------------------------------------------------------------
// IN-MEMORY DATA STORE (STUB FOR SUPABASE)
// ---------------------------------------------------------------------------
// Every function here is the seam where a real Supabase call will go. The data
// currently lives in module memory (it resets on a full page reload). Each
// mutator/reader has a TODO showing the equivalent Supabase query so you can
// swap them out table-by-table without touching the UI.
// ---------------------------------------------------------------------------

import { useRef, useSyncExternalStore } from "react"
import type {
  Candidate,
  Certificate,
  ConsentRecord,
  Question,
  Test,
  TestStatus,
} from "@/lib/types"

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

interface DB {
  tests: Test[]
  candidates: Candidate[]
  consents: ConsentRecord[]
  certificates: Certificate[]
}

// --- Seed data ------------------------------------------------------------

function seed(): DB {
  const t1 = "test_frontend"
  const t2 = "test_backend"
  const t3 = "test_pm"

  const tests: Test[] = [
    {
      id: t1,
      title: "Senior Frontend Engineer",
      description:
        "Assesses React, TypeScript, and web fundamentals. Mix of multiple choice and a short coding task.",
      time_limit_minutes: 45,
      deadline: "2026-08-01",
      randomize_questions: true,
      requires_proctoring: true,
      certificate_eligible: true,
      certificate_percentile_threshold: 25,
      status: "active",
      token: "fe-2026-a1b2",
      created_at: "2026-06-20T10:00:00.000Z",
      questions: [
        {
          id: uid("q"),
          test_id: t1,
          type: "multiple_choice",
          prompt: "Which hook lets you subscribe to an external store in React 18+?",
          options: ["useMemo", "useSyncExternalStore", "useDeferredValue", "useId"],
          correct_option_index: 1,
          position: 0,
        },
        {
          id: uid("q"),
          test_id: t1,
          type: "multiple_choice",
          prompt: "What does the CSS property `gap` control?",
          options: [
            "The border radius of an element",
            "Spacing between flex or grid items",
            "The opacity of a layer",
            "Font letter spacing",
          ],
          correct_option_index: 1,
          position: 1,
        },
        {
          id: uid("q"),
          test_id: t1,
          type: "coding",
          prompt:
            "Write a function `debounce(fn, wait)` that returns a debounced version of `fn`.",
          options: [],
          correct_option_index: null,
          position: 2,
        },
        {
          id: uid("q"),
          test_id: t1,
          type: "short_answer",
          prompt: "In one sentence, explain the difference between SSR and SSG.",
          options: [],
          correct_option_index: null,
          position: 3,
        },
      ],
    },
    {
      id: t2,
      title: "Backend Engineer — Go",
      description:
        "Covers concurrency, HTTP services, and database fundamentals in Go.",
      time_limit_minutes: 60,
      deadline: null,
      randomize_questions: false,
      requires_proctoring: false,
      certificate_eligible: false,
      certificate_percentile_threshold: 25,
      status: "active",
      token: "be-2026-c3d4",
      created_at: "2026-06-24T09:30:00.000Z",
      questions: [
        {
          id: uid("q"),
          test_id: t2,
          type: "multiple_choice",
          prompt: "What is the zero value of a `chan int` in Go?",
          options: ["0", "nil", "an empty channel", "panic"],
          correct_option_index: 1,
          position: 0,
        },
        {
          id: uid("q"),
          test_id: t2,
          type: "short_answer",
          prompt: "When would you use a buffered channel over an unbuffered one?",
          options: [],
          correct_option_index: null,
          position: 1,
        },
      ],
    },
    {
      id: t3,
      title: "Product Manager Screening",
      description: "Prioritization, product sense, and communication.",
      time_limit_minutes: 30,
      deadline: "2026-07-15",
      randomize_questions: false,
      requires_proctoring: false,
      certificate_eligible: false,
      certificate_percentile_threshold: 25,
      status: "draft",
      token: "pm-2026-e5f6",
      created_at: "2026-07-01T14:00:00.000Z",
      questions: [
        {
          id: uid("q"),
          test_id: t3,
          type: "short_answer",
          prompt:
            "How would you decide between two features with similar reach but different effort?",
          options: [],
          correct_option_index: null,
          position: 0,
        },
      ],
    },
  ]

  const consents: ConsentRecord[] = [
    {
      id: "consent_1",
      candidate_id: "cand_1",
      test_id: t1,
      consent_version: "v1",
      consent_text_snapshot:
        "Before you begin: proctoring consent — camera, screen recording, one-time face verification. Retained 90 days.",
      accepted: true,
      responded_at: "2026-06-28T11:02:00.000Z",
    },
    {
      id: "consent_2",
      candidate_id: "cand_2",
      test_id: t1,
      consent_version: "v1",
      consent_text_snapshot:
        "Before you begin: proctoring consent — camera, screen recording, one-time face verification. Retained 90 days.",
      accepted: true,
      responded_at: "2026-06-29T15:40:00.000Z",
    },
  ]

  const candidates: Candidate[] = [
    {
      id: "cand_1",
      test_id: t1,
      email: "maria.lopez@example.com",
      status: "submitted",
      score: 100,
      tab_switch_count: 0,
      consent_id: "consent_1",
      started_at: "2026-06-28T11:00:00.000Z",
      submitted_at: "2026-06-28T11:38:00.000Z",
    },
    {
      id: "cand_2",
      test_id: t1,
      email: "j.chen@example.com",
      status: "submitted",
      score: 50,
      tab_switch_count: 4,
      consent_id: "consent_2",
      started_at: "2026-06-29T15:38:00.000Z",
      submitted_at: "2026-06-29T16:20:00.000Z",
    },
    {
      id: "cand_3",
      test_id: t1,
      email: "sam.taylor@example.com",
      status: "in_progress",
      score: null,
      tab_switch_count: 1,
      consent_id: null,
      started_at: "2026-07-06T09:15:00.000Z",
      submitted_at: null,
    },
    {
      id: "cand_4",
      test_id: t2,
      email: "priya.nair@example.com",
      status: "submitted",
      score: 100,
      tab_switch_count: 0,
      consent_id: null,
      started_at: "2026-06-25T13:00:00.000Z",
      submitted_at: "2026-06-25T13:52:00.000Z",
    },
  ]

  const certificates: Certificate[] = [
    {
      id: "cert_1",
      slug: "vertana-maria-lopez-fe-9x4k2p",
      candidate_name: "Maria Lopez",
      candidate_email: "maria.lopez@example.com",
      test_id: t1,
      skill_name: "Senior Frontend Engineer",
      percentile_band: "Top 25%",
      issued_at: "2026-06-28T12:00:00.000Z",
      revoked: false,
    },
  ]

  return { tests, candidates, consents, certificates }
}

let db: DB = seed()

// --- Subscription plumbing for useSyncExternalStore -----------------------

const listeners = new Set<() => void>()
let version = 0
function emit() {
  version++
  for (const l of listeners) l()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// --- Readers --------------------------------------------------------------

export function getTests(): Test[] {
  // TODO(supabase): const { data } = await supabase
  //   .from("tests").select("*, questions(*)").order("created_at", { ascending: false })
  return [...db.tests].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getTest(id: string): Test | undefined {
  // TODO(supabase): supabase.from("tests").select("*, questions(*)").eq("id", id).single()
  return db.tests.find((t) => t.id === id)
}

export function getTestByToken(token: string): Test | undefined {
  // TODO(supabase): supabase.from("tests").select("*, questions(*)").eq("token", token).single()
  return db.tests.find((t) => t.token === token)
}

export function getCandidatesForTest(testId: string): Candidate[] {
  // TODO(supabase): supabase.from("candidates").select("*").eq("test_id", testId)
  return db.candidates.filter((c) => c.test_id === testId)
}

export function getConsent(id: string | null): ConsentRecord | undefined {
  if (!id) return undefined
  // TODO(supabase): supabase.from("consents").select("*").eq("id", id).single()
  return db.consents.find((c) => c.id === id)
}

export function candidateCount(testId: string): number {
  return db.candidates.filter((c) => c.test_id === testId).length
}

// --- Mutators -------------------------------------------------------------

export function saveTest(test: Test) {
  // TODO(supabase): upsert the test row, then diff + upsert/delete question rows:
  //   await supabase.from("tests").upsert({ ...testRow })
  //   await supabase.from("questions").upsert(test.questions)
  const idx = db.tests.findIndex((t) => t.id === test.id)
  if (idx === -1) {
    db.tests = [test, ...db.tests]
  } else {
    db.tests = db.tests.map((t) => (t.id === test.id ? test : t))
  }
  emit()
}

export function setTestStatus(id: string, status: TestStatus) {
  // TODO(supabase): supabase.from("tests").update({ status }).eq("id", id)
  db.tests = db.tests.map((t) => (t.id === id ? { ...t, status } : t))
  emit()
}

export function deleteTest(id: string) {
  // TODO(supabase): supabase.from("tests").delete().eq("id", id)
  db.tests = db.tests.filter((t) => t.id !== id)
  db.candidates = db.candidates.filter((c) => c.test_id !== id)
  emit()
}

interface SubmitAttemptInput {
  testId: string
  email: string
  answers: Record<string, string> // questionId -> answer (option index as string for MCQ)
  tabSwitchCount: number
  startedAt: string
  consent?: {
    accepted: boolean
    version: string
    snapshot: string
  }
}

// Grades the MCQ portion and records the candidate + consent rows.
export function submitAttempt(input: SubmitAttemptInput): Candidate {
  const test = getTest(input.testId)
  const now = new Date().toISOString()

  let consentId: string | null = null
  if (input.consent) {
    const consent: ConsentRecord = {
      id: uid("consent"),
      candidate_id: "", // filled in below
      test_id: input.testId,
      consent_version: input.consent.version,
      consent_text_snapshot: input.consent.snapshot,
      accepted: input.consent.accepted,
      responded_at: now,
    }
    // TODO(supabase): insert into "consents" and keep the returned id
    db.consents = [...db.consents, consent]
    consentId = consent.id
  }

  // Auto-grade multiple choice; short answer / coding need manual review.
  let gradable = 0
  let correct = 0
  test?.questions.forEach((q) => {
    if (q.type === "multiple_choice" && q.correct_option_index !== null) {
      gradable += 1
      if (input.answers[q.id] === String(q.correct_option_index)) correct += 1
    }
  })
  const score = gradable > 0 ? Math.round((correct / gradable) * 100) : null

  const candidate: Candidate = {
    id: uid("cand"),
    test_id: input.testId,
    email: input.email,
    status: "submitted",
    score,
    tab_switch_count: input.tabSwitchCount,
    consent_id: consentId,
    started_at: input.startedAt,
    submitted_at: now,
  }

  if (consentId) {
    db.consents = db.consents.map((c) =>
      c.id === consentId ? { ...c, candidate_id: candidate.id } : c,
    )
  }

  // TODO(supabase): insert into "candidates"
  db.candidates = [...db.candidates, candidate]
  emit()
  return candidate
}

// --- Certificates ---------------------------------------------------------

// Maps a candidate's "top X%" standing to a clean display band.
function bandForTopPercent(topPercent: number): string {
  const tiers = [1, 5, 10, 25, 50]
  const tier = tiers.find((t) => topPercent <= t) ?? 100
  return `Top ${tier}%`
}

export interface CertificateEvaluation {
  qualifies: boolean
  band: string
  topPercent: number
}

// Decides whether a submitted candidate lands in the test's top-percentile
// threshold. Compares against all graded submissions for the same test.
// TODO(supabase): compute this with a window function / percentile_cont over
// the candidates table instead of in memory.
export function evaluateCertificate(
  test: Test,
  candidate: Candidate,
): CertificateEvaluation {
  if (
    !test.certificate_eligible ||
    candidate.score === null ||
    candidate.status !== "submitted"
  ) {
    return { qualifies: false, band: "", topPercent: 100 }
  }

  const peers = db.candidates.filter(
    (c) =>
      c.test_id === test.id && c.status === "submitted" && c.score !== null,
  )
  const total = peers.length || 1
  const higher = peers.filter(
    (c) => (c.score as number) > (candidate.score as number),
  ).length
  const topPercent = Math.round((higher / total) * 100)
  const qualifies = topPercent <= test.certificate_percentile_threshold

  return { qualifies, band: bandForTopPercent(topPercent), topPercent }
}

interface IssueCertificateInput {
  testId: string
  candidateName: string
  candidateEmail: string
  skillName: string
  band: string
}

export function issueCertificate(input: IssueCertificateInput): Certificate {
  const slug = `vertana-${slugify(input.candidateName)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
  const certificate: Certificate = {
    id: uid("cert"),
    slug,
    candidate_name: input.candidateName.trim(),
    candidate_email: input.candidateEmail.trim(),
    test_id: input.testId,
    skill_name: input.skillName,
    percentile_band: input.band,
    issued_at: new Date().toISOString(),
    revoked: false,
  }
  // TODO(supabase): insert into "certificates" with a unique slug
  db.certificates = [...db.certificates, certificate]
  emit()
  return certificate
}

export function getCertificateBySlug(slug: string): Certificate | undefined {
  // TODO(supabase): supabase.from("certificates").select("*").eq("slug", slug).single()
  return db.certificates.find((c) => c.slug === slug)
}

export function revokeCertificate(slug: string) {
  // TODO(supabase): supabase.from("certificates").update({ revoked: true }).eq("slug", slug)
  db.certificates = db.certificates.map((c) =>
    c.slug === slug ? { ...c, revoked: true } : c,
  )
  emit()
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "candidate"
  )
}

// --- React hook -----------------------------------------------------------

export function useStore<T>(selector: (db: DB) => T): T {
  // Cache the selector result per hook instance and only recompute when the
  // store version changes. This keeps getSnapshot/getServerSnapshot referentially
  // stable between renders, which useSyncExternalStore requires to avoid
  // infinite update loops (especially for selectors that return new objects).
  const cache = useRef<{ version: number; value: T } | null>(null)

  const getSnapshot = () => {
    if (cache.current === null || cache.current.version !== version) {
      cache.current = { version, value: selector(db) }
    }
    return cache.current.value
  }

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
