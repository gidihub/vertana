import {
  IconSparkles,
  IconListCheck,
  IconCode,
  IconWriting,
  IconClock,
  IconCalendarDue,
  IconArrowsShuffle,
  IconEyeCheck,
  IconChartBar,
  IconFileSpreadsheet,
  IconLayoutGrid,
  IconWand,
  IconShieldCheck,
  IconVideo,
  IconActivity,
  IconLockCheck,
  IconTrophy,
  IconFilter,
  IconUsersGroup,
  IconWorld,
  IconTerminal2,
  IconClipboardCheck,
  IconRoute,
  IconGauge,
  type IconProps,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

type Icon = ComponentType<IconProps>

export interface Highlight {
  icon: Icon
  title: string
  body: string
}

export interface FeatureContent {
  slug: string
  eyebrow: string
  title: string
  lead: string
  bullets: string[]
  highlights: Highlight[]
  detail: {
    heading: string
    body: string
    points: string[]
  }
  checklist: string[]
}

export const FEATURES: FeatureContent[] = [
  {
    slug: "test-builder",
    eyebrow: "Product · Test builder",
    title: "Build a fair, timed assessment in minutes",
    lead: "The test builder is where a role becomes a real screen. Compose questions, mix formats, and set the rules of engagement — all from one focused editor with no setup.",
    bullets: [
      "Multiple choice, short answer, and coding in one test",
      "Reorder, duplicate, and edit inline",
      "Save as draft and publish when ready",
    ],
    highlights: [
      {
        icon: IconLayoutGrid,
        title: "Mixed question types",
        body: "Combine auto-scored multiple choice, written short answer, and live coding questions in a single assessment.",
      },
      {
        icon: IconClock,
        title: "Time limits & deadlines",
        body: "Cap how long the whole test runs and set a deadline that closes the candidate link automatically.",
      },
      {
        icon: IconArrowsShuffle,
        title: "Randomized order",
        body: "Shuffle question order per candidate to reduce sharing and keep every attempt independent.",
      },
    ],
    detail: {
      heading: "One editor, from draft to published",
      body: "Everything about a test lives in a single builder. Add a question, set its weight, and see the assessment take shape without switching screens or saving drafts by hand.",
      points: [
        "Inline editing with instant reordering",
        "Per-question scoring weights",
        "Draft and active states with a single toggle",
        "Duplicate an existing test to start from a proven baseline",
      ],
    },
    checklist: [
      "No accounts or installs for candidates",
      "One secure link per test",
      "Edit and re-publish at any time",
    ],
  },
  {
    slug: "ai-question-generation",
    eyebrow: "Product · AI question generation",
    title: "Draft a role-specific question set from a prompt",
    lead: "Describe the role and the skills you care about, and Vertana drafts a starting set of questions you can keep, edit, or discard. You stay in control — AI just removes the blank page.",
    bullets: [
      "Generate a full set in seconds",
      "Every question is fully editable",
      "Tune difficulty and focus areas",
    ],
    highlights: [
      {
        icon: IconWand,
        title: "Prompt to draft",
        body: "Turn a short role description into a structured set of questions across the formats you enable.",
      },
      {
        icon: IconSparkles,
        title: "Skill-aware",
        body: "Questions target the competencies you name, so a frontend screen reads differently from a data role.",
      },
      {
        icon: IconWriting,
        title: "Human in the loop",
        body: "Nothing is published automatically. Review, rewrite, and cut until the set reflects your bar.",
      },
    ],
    detail: {
      heading: "A faster first draft, never the final word",
      body: "AI generation is a head start, not an autopilot. Generated questions drop straight into the builder where you can refine wording, adjust answers, and set scoring exactly as you would by hand.",
      points: [
        "Regenerate individual questions you don't like",
        "Mix generated and hand-written questions freely",
        "Set correct answers and weights before publishing",
        "Keep a consistent bar across every role you screen",
      ],
    },
    checklist: [
      "You approve every question before it ships",
      "Editable multiple choice, short answer, and coding",
      "No candidate ever sees an unreviewed draft",
    ],
  },
  {
    slug: "proctoring",
    eyebrow: "Product · Proctoring",
    title: "Consent-first proctoring you can defend",
    lead: "When integrity matters, Vertana monitors the session with the candidate's clear, up-front consent — camera verification and focus tracking, always disclosed, never hidden.",
    bullets: [
      "Explicit consent before anything is recorded",
      "Camera verification and tab-switch tracking",
      "A full, auditable activity trail",
    ],
    highlights: [
      {
        icon: IconShieldCheck,
        title: "Consent up front",
        body: "Candidates see exactly what will be monitored and must agree before the test begins. No surprises.",
      },
      {
        icon: IconVideo,
        title: "Camera verification",
        body: "Confirm the right person is taking the test with a clear, disclosed camera check at the start.",
      },
      {
        icon: IconActivity,
        title: "Focus tracking",
        body: "Tab switches and focus loss are logged and surfaced on results, so you can weigh them fairly.",
      },
    ],
    detail: {
      heading: "Integrity signals, not black boxes",
      body: "Proctoring is optional per test and fully transparent. Every monitored event is recorded to an activity trail you and the candidate can understand, so decisions are defensible.",
      points: [
        "Toggle proctoring on or off per assessment",
        "Consent version is stored with each attempt",
        "Tab-switch counts shown alongside scores",
        "Nothing is monitored without disclosure",
      ],
    },
    checklist: [
      "Candidate consent is required and recorded",
      "Clear disclosure of every monitored signal",
      "Auditable trail attached to each submission",
    ],
  },
  {
    slug: "results-reporting",
    eyebrow: "Product · Results and reporting",
    title: "Ranked, verified results you can act on",
    lead: "Auto-scored submissions land in a dashboard sorted by signal. See the score distribution, review individual answers, and hand a clean shortlist to any hiring panel.",
    bullets: [
      "Ranked by score, with integrity flags",
      "Score distribution at a glance",
      "One-click CSV export",
    ],
    highlights: [
      {
        icon: IconChartBar,
        title: "Results dashboard",
        body: "See every candidate ranked by score with completion rate, average time, and the full distribution.",
      },
      {
        icon: IconTrophy,
        title: "Percentile standing",
        body: "Understand where each candidate lands against the pool, so strong performances stand out immediately.",
      },
      {
        icon: IconFileSpreadsheet,
        title: "CSV export",
        body: "Export results in one click to share with a panel or drop into your existing hiring workflow.",
      },
    ],
    detail: {
      heading: "From raw submissions to a defensible shortlist",
      body: "Reporting turns dozens of attempts into a clear ranking. Drill into any candidate to review their answers and activity, or export the whole set for a panel review.",
      points: [
        "Per-candidate answer review",
        "Completion rate and average-time stats",
        "Integrity flags surfaced inline",
        "Export the full pool as CSV",
      ],
    },
    checklist: [
      "Automatic scoring for objective questions",
      "Activity trail attached to every result",
      "Shareable, exportable, panel-ready",
    ],
  },
]

export interface UseCaseContent {
  slug: string
  eyebrow: string
  title: string
  lead: string
  bullets: string[]
  pains: { title: string; body: string }[]
  solutions: Highlight[]
  outcomes: { stat: string; label: string }[]
}

export const USE_CASES: UseCaseContent[] = [
  {
    slug: "recruiters",
    eyebrow: "Use case · For recruiters",
    title: "Screen more candidates on real signal, not résumés",
    lead: "Send one link, get back a ranked shortlist. Vertana lets recruiting teams verify skills before the first call, so you spend interview time on the people most likely to convert.",
    bullets: [
      "One link, no candidate accounts",
      "Ranked results in a shared dashboard",
      "Defensible, auditable scoring",
    ],
    pains: [
      {
        title: "Résumés don't predict performance",
        body: "Keyword-matched résumés push weak candidates forward and bury strong ones who don't write the right buzzwords.",
      },
      {
        title: "Phone screens don't scale",
        body: "Manually screening a large top-of-funnel eats hours and still relies on gut feel rather than evidence.",
      },
    ],
    solutions: [
      {
        icon: IconFilter,
        title: "Filter on evidence",
        body: "Every candidate takes the same timed test, so your shortlist is built on comparable, objective signal.",
      },
      {
        icon: IconRoute,
        title: "Zero-friction invites",
        body: "Share a single secure link. Candidates start immediately — no sign-ups, downloads, or scheduling.",
      },
      {
        icon: IconClipboardCheck,
        title: "Panel-ready results",
        body: "Hand hiring managers a ranked view with scores, timing, and integrity flags they can trust.",
      },
    ],
    outcomes: [
      { stat: "1 link", label: "to invite an entire pipeline" },
      { stat: "Ranked", label: "shortlist, sorted by signal" },
      { stat: "CSV", label: "export for any panel review" },
    ],
  },
  {
    slug: "remote-hiring",
    eyebrow: "Use case · For remote hiring",
    title: "Hire confidently across time zones",
    lead: "Async by design, Vertana lets distributed teams assess candidates anywhere without scheduling a live call. Consent-first proctoring keeps remote assessments fair and verifiable.",
    bullets: [
      "Fully asynchronous — no scheduling",
      "Consent-first proctoring built in",
      "Same test, every candidate, anywhere",
    ],
    pains: [
      {
        title: "Scheduling across time zones stalls hiring",
        body: "Coordinating live technical screens across regions adds days of back-and-forth before you learn anything.",
      },
      {
        title: "Remote assessments are hard to trust",
        body: "Without any integrity signal, it's difficult to know whether a remote result reflects the candidate's own work.",
      },
    ],
    solutions: [
      {
        icon: IconWorld,
        title: "Async everywhere",
        body: "Candidates take the test whenever works for them within your deadline — no calendars to align.",
      },
      {
        icon: IconLockCheck,
        title: "Verifiable integrity",
        body: "Optional camera verification and focus tracking, disclosed up front, make remote results defensible.",
      },
      {
        icon: IconGauge,
        title: "Consistent bar",
        body: "Everyone sees the same assessment under the same rules, so location never changes the standard.",
      },
    ],
    outcomes: [
      { stat: "0 calls", label: "to complete a first screen" },
      { stat: "Any zone", label: "candidates test on their time" },
      { stat: "Audited", label: "every attempt logged" },
    ],
  },
  {
    slug: "technical-teams",
    eyebrow: "Use case · For technical teams",
    title: "Assess real engineering skill, not trivia",
    lead: "Built for teams that hire engineers, Vertana supports coding questions and written reasoning so you evaluate how someone actually thinks and builds — before you spend engineering hours interviewing.",
    bullets: [
      "Coding questions with real evaluation",
      "Short answer for design reasoning",
      "Protect engineers' interview time",
    ],
    pains: [
      {
        title: "Interview time is your scarcest resource",
        body: "Every unqualified on-site burns senior engineering hours you can't get back.",
      },
      {
        title: "Whiteboard trivia misses real ability",
        body: "Puzzle questions reward memorization, not the practical judgment your team actually needs.",
      },
    ],
    solutions: [
      {
        icon: IconTerminal2,
        title: "Real coding questions",
        body: "Evaluate practical coding ability with questions that reflect the work, not brain-teasers.",
      },
      {
        icon: IconWriting,
        title: "Reasoning in writing",
        body: "Short-answer questions surface how a candidate approaches trade-offs and design decisions.",
      },
      {
        icon: IconUsersGroup,
        title: "Protect the team's focus",
        body: "Only strong, verified candidates reach a live interview, so engineers focus on the best signal.",
      },
    ],
    outcomes: [
      { stat: "Code", label: "evaluated, not memorized trivia" },
      { stat: "Fewer", label: "unqualified on-site interviews" },
      { stat: "Signal", label: "ranked before you meet" },
    ],
  },
]

export function getFeature(slug: string) {
  return FEATURES.find((f) => f.slug === slug)
}

export function getUseCase(slug: string) {
  return USE_CASES.find((u) => u.slug === slug)
}
