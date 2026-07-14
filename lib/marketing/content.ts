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
    title: "Consent-first integrity monitoring you can defend",
    lead: "When integrity matters, Vertana tracks tab focus with the candidate's clear, up-front consent — always disclosed, never hidden. Camera verification is on the roadmap for Growth plans.",
    bullets: [
      "Explicit consent before monitoring begins",
      "Tab-switch and focus-loss tracking today",
      "Camera verification coming to Growth",
    ],
    highlights: [
      {
        icon: IconShieldCheck,
        title: "Consent up front",
        body: "Candidates see exactly what will be monitored and must agree before the test begins. No surprises.",
      },
      {
        icon: IconVideo,
        title: "Camera verification (coming)",
        body: "Optional face verification at test start is planned for Growth-tier proctored assessments.",
      },
      {
        icon: IconActivity,
        title: "Focus tracking (live)",
        body: "Tab switches and focus loss are logged and surfaced on results, so you can weigh them fairly.",
      },
    ],
    detail: {
      heading: "Integrity signals, not black boxes",
      body: "Proctoring is optional per test and fully transparent. Tab-focus events are recorded today; camera and screen capture are coming in a later release.",
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
    slug: "technical-hiring",
    eyebrow: "Use case · Technical hiring",
    title: "Technical hiring",
    lead: "Verify engineering skill before the interview loop even starts. Vertana evaluates real coding and design reasoning up front, so senior engineers only meet candidates who've already proven they can do the work.",
    bullets: [
      "Coding questions with real execution",
      "Short answer for design reasoning",
      "Protect senior engineers' time",
    ],
    pains: [
      {
        title: "Interview time is your scarcest resource",
        body: "Every unqualified on-site burns senior engineering hours you can't get back — and the loop stalls behind them.",
      },
      {
        title: "Résumés and trivia don't predict ability",
        body: "Keyword-matched CVs and whiteboard puzzles reward the wrong things. Neither tells you whether someone can actually build.",
      },
    ],
    solutions: [
      {
        icon: IconTerminal2,
        title: "Real coding questions",
        body: "Evaluate practical coding ability with questions that reflect the work, run in a sandboxed execution environment.",
      },
      {
        icon: IconWriting,
        title: "Reasoning in writing",
        body: "Short-answer questions surface how a candidate approaches trade-offs and design decisions, not just syntax.",
      },
      {
        icon: IconUsersGroup,
        title: "Protect the team's focus",
        body: "Only strong, verified candidates reach a live interview, so engineers spend their hours on the best signal.",
      },
    ],
    outcomes: [
      { stat: "Code", label: "evaluated, not memorized trivia" },
      { stat: "Fewer", label: "unqualified on-site interviews" },
      { stat: "Signal", label: "ranked before you meet" },
    ],
  },
  {
    slug: "remote-hiring",
    eyebrow: "Use case · Remote hiring",
    title: "Remote hiring",
    lead: "Run a consistent, verifiable screen across time zones with no in-person step. Async by design, Vertana lets distributed teams assess candidates anywhere, with consent-first monitoring that keeps results fair.",
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
        body: "Consent-first proctoring and focus tracking, disclosed up front, make remote results defensible.",
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
    slug: "high-volume-screening",
    eyebrow: "Use case · High-volume screening",
    title: "High-volume screening",
    lead: "Rank hundreds of applicants automatically instead of reading every résumé. One link screens the whole funnel, and auto-scored results come back sorted by signal — so your team starts at the top.",
    bullets: [
      "One link for the entire funnel",
      "Auto-scored, ranked results",
      "Integrity flags surfaced inline",
    ],
    pains: [
      {
        title: "Reading every résumé doesn't scale",
        body: "A large top-of-funnel means hundreds of CVs, and the strongest candidates get lost in the pile.",
      },
      {
        title: "Manual phone screens burn days",
        body: "Screening volume by hand relies on gut feel, introduces bias, and delays your response to the best people.",
      },
    ],
    solutions: [
      {
        icon: IconRoute,
        title: "One link, zero friction",
        body: "Share a single secure link with your whole applicant pool. Candidates start immediately — no accounts or installs.",
      },
      {
        icon: IconFilter,
        title: "Filter on evidence",
        body: "Every applicant takes the same timed test, so your shortlist is built on comparable, objective signal.",
      },
      {
        icon: IconChartBar,
        title: "Ranked in one dashboard",
        body: "Results land auto-scored and sorted, with completion time and integrity flags, ready to action.",
      },
    ],
    outcomes: [
      { stat: "Hundreds", label: "screened from a single link" },
      { stat: "Ranked", label: "automatically, by score" },
      { stat: "Hours", label: "saved on every role" },
    ],
  },
  {
    slug: "recruitment-agencies",
    eyebrow: "Use case · Recruitment agencies",
    title: "Recruitment agencies",
    lead: "Hand clients a ranked, defensible shortlist instead of a stack of CVs. Vertana gives agencies comparable, evidence-backed scores across every role — with unlimited seats so the whole desk works from one account.",
    bullets: [
      "Defensible, comparable scores",
      "Unlimited seats across your desk",
      "CSV export for client handoff",
    ],
    pains: [
      {
        title: "Clients don't trust a CV stack",
        body: "Submitting résumés alone invites second-guessing. You need evidence that a candidate can do the job.",
      },
      {
        title: "Every placement is a decision you must defend",
        body: "When a shortlist is challenged, gut feel isn't a defence — you need comparable results behind each name.",
      },
    ],
    solutions: [
      {
        icon: IconClipboardCheck,
        title: "Defensible shortlists",
        body: "Every candidate is scored on the same test, so each submission comes with objective, comparable evidence.",
      },
      {
        icon: IconUsersGroup,
        title: "Unlimited seats",
        body: "Put your whole desk on one account at no extra cost — no per-seat pricing eating into your margin.",
      },
      {
        icon: IconFileSpreadsheet,
        title: "Client-ready export",
        body: "Export a ranked, formatted results set in one click to hand straight to the client with confidence.",
      },
    ],
    outcomes: [
      { stat: "Ranked", label: "shortlist per client role" },
      { stat: "Unlimited", label: "team seats, one account" },
      { stat: "Evidence", label: "behind every submission" },
    ],
  },
  {
    slug: "graduate-campus-hiring",
    eyebrow: "Use case · Graduate & campus hiring",
    title: "Graduate & campus hiring",
    lead: "Assess potential at scale when candidates have thin work history. Vertana measures skill and reasoning directly, so a whole cohort gets a fair, comparable shot regardless of what's on the résumé.",
    bullets: [
      "Skills over résumés",
      "The same bar for every applicant",
      "Scales to a full cohort",
    ],
    pains: [
      {
        title: "Thin CVs make grads hard to compare",
        body: "With little work history, résumés reward the best-connected, not the most capable — and real talent gets missed.",
      },
      {
        title: "Campus volume overwhelms the funnel",
        body: "Hundreds of applicants per role means signal is low and manual review is impossible to do fairly.",
      },
    ],
    solutions: [
      {
        icon: IconGauge,
        title: "A consistent bar",
        body: "Every applicant sits the same assessment under the same rules, so the standard never bends to background.",
      },
      {
        icon: IconFilter,
        title: "Potential over pedigree",
        body: "Measure how someone thinks and solves, not which university or internship they had access to.",
      },
      {
        icon: IconChartBar,
        title: "Cohort-scale ranking",
        body: "Screen an entire graduating class from one link and get a ranked, comparable view of the whole cohort.",
      },
    ],
    outcomes: [
      { stat: "Whole cohort", label: "screened from one link" },
      { stat: "Potential", label: "measured, not assumed" },
      { stat: "Fair", label: "comparable results for all" },
    ],
  },
  {
    slug: "first-technical-hire",
    eyebrow: "Use case · First technical hire",
    title: "First technical hire",
    lead: "Evaluate skills you don't have in-house yet, with confidence. Vertana's AI-drafted, work-sample questions let a non-technical founder or team screen for real ability — and make a defensible first decision.",
    bullets: [
      "Assess skills you can't yet",
      "AI-drafted, work-sample questions",
      "A defensible first decision",
    ],
    pains: [
      {
        title: "You can't interview for skills you don't have",
        body: "Without an engineer on staff, it's hard to tell a strong technical candidate from a confident one.",
      },
      {
        title: "The first hire is the most expensive to get wrong",
        body: "Your first technical hire shapes everything after it — a bad call sets the whole team back.",
      },
    ],
    solutions: [
      {
        icon: IconWand,
        title: "AI-drafted questions",
        body: "Describe the role and Vertana drafts a role-specific assessment, so you start from an expert-shaped baseline.",
      },
      {
        icon: IconTerminal2,
        title: "Real work samples",
        body: "Candidates solve practical problems with real execution — you see ability, not just a polished conversation.",
      },
      {
        icon: IconShieldCheck,
        title: "A decision you can defend",
        body: "Objective, comparable scores give you the evidence to back your first technical hire with confidence.",
      },
    ],
    outcomes: [
      { stat: "Screen", label: "without an expert on staff" },
      { stat: "Real work", label: "evaluated, not trivia" },
      { stat: "Confidence", label: "in hire number one" },
    ],
  },
]

export function getFeature(slug: string) {
  return FEATURES.find((f) => f.slug === slug)
}

export function getUseCase(slug: string) {
  return USE_CASES.find((u) => u.slug === slug)
}
