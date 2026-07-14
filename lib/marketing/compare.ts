/**
 * Comparison-page content. Competitor facts are sourced from each vendor's own
 * pricing page and public review aggregators, verified 2026 (see `sourceDomain`
 * and the footnote rendered on each page). Rows are only included where the fact
 * is confirmed — do not add rows without re-verifying against the source.
 */

export interface CompareRow {
  feature: string
  vertana: string
  competitor: string
}

export interface CompareContent {
  slug: string
  competitor: string
  intro: string
  /** Optional category-honesty note rendered before the table. */
  note?: string
  rows: CompareRow[]
  /** Primary source domain for the sourcing footnote. */
  sourceDomain: string
}

export const COMPARISONS: CompareContent[] = [
  {
    slug: "vertana-vs-testtrick",
    competitor: "TestTrick",
    sourceDomain: "testtrick.com",
    intro:
      "TestTrick is a full-featured assessment platform with a deep test library and heavy lockdown-style monitoring. Vertana takes the opposite bet on integrity — designing assessments an AI can't complete for the candidate — and keeps seats unlimited on every plan, including Free. Here's an honest side-by-side.",
    rows: [
      {
        feature: "Pricing model",
        vertana: "$19–39/mo flat, unlimited seats",
        competitor:
          "$35–75/mo — every tier has the same features, only volume differs",
      },
      {
        feature: "Free plan",
        vertana: "Yes — $0/mo, 10 candidates/mo, ongoing",
        competitor: "Free trial only, no ongoing free plan",
      },
      {
        feature: "Team members",
        vertana: "Unlimited on every plan",
        competitor: "3 users on Starter, 5 on Basic, 7 on Business",
      },
      {
        feature: "Approach to AI cheating",
        vertana: "AI-resistant question design + consented monitoring",
        competitor:
          "Lockdown Mode, dual webcam + screen monitoring, blocked apps",
      },
      {
        feature: "Test library size",
        vertana: "800+ curated questions across 16 categories",
        competitor: "500+ pre-built tests across 30+ skill areas",
      },
      {
        feature: "Coding languages",
        vertana: "Core languages supported",
        competitor: "15+ languages with live code playback",
      },
      {
        feature: "Video interviews",
        vertana: "Not yet offered",
        competitor: "Async one-way video interviews built in",
      },
      {
        feature: "Psychometric assessments",
        vertana: "Not yet offered",
        competitor: "Personality & psychometric tests included",
      },
      {
        feature: "White-labeling",
        vertana: "Not offered",
        competitor: "Branded interface on request",
      },
      {
        feature: "ATS integrations",
        vertana: "Growth plan and above",
        competitor: "Included on every plan",
      },
      {
        feature: "Regional (PPP) pricing",
        vertana: "Yes — automatic purchasing-power pricing in ~90 countries",
        competitor: "Not offered",
      },
    ],
  },
  {
    slug: "vertana-vs-testdome",
    competitor: "TestDome",
    sourceDomain: "testdome.com",
    intro:
      "TestDome is a pay-per-candidate assessment service with a deep technical question bank and no subscription. Vertana is a flat monthly subscription with unlimited seats, an ongoing free plan, and integrity built on AI-resistant question design rather than snapshots. Here's how they line up.",
    rows: [
      {
        feature: "Pricing model",
        vertana: "$19–39/mo flat subscription",
        competitor: "Prepaid packs, $7–$20 per candidate, no subscription",
      },
      {
        feature: "Free plan",
        vertana: "Yes — $0/mo, 10 candidates/mo, ongoing",
        competitor: "No permanent free plan; free trial only",
      },
      {
        feature: "Unused credit / invite expiry",
        vertana: "Purchased packs expire 24 months; plan credits don't roll over",
        competitor: "Invites never expire",
      },
      {
        feature: "Approach to AI cheating",
        vertana: "AI-resistant question design + consented monitoring",
        competitor:
          "Webcam snapshots, duplicate-email detection, copy-paste blocking",
      },
      {
        feature: "Coding / technical library depth",
        vertana: "800+ questions across 16 roles; broad rather than coding-deep",
        competitor: "1,000+ questions, strong technical/coding focus",
      },
      {
        feature: "ATS integrations",
        vertana: "Growth plan and above",
        competitor:
          "Greenhouse, SmartRecruiters, Recruitee, Pinpoint, TalentLyft, Zapier — all plans",
      },
      {
        feature: "Non-technical role coverage",
        vertana: "Built for technical and non-technical hiring",
        competitor:
          "Reviewers note stronger coverage for technical than non-technical roles",
      },
      {
        feature: "Proctoring review speed",
        vertana: "Session log built for quick review",
        competitor:
          "User reviews report slow playback on longer proctored sessions",
      },
      {
        feature: "Regional (PPP) pricing",
        vertana: "Yes — automatic purchasing-power pricing in ~90 countries",
        competitor: "Not offered",
      },
    ],
  },
  {
    slug: "vertana-vs-testgorilla",
    competitor: "TestGorilla",
    sourceDomain: "testgorilla.com",
    intro:
      "TestGorilla is a broad multi-measure assessment library covering cognitive, personality, and language testing. Vertana is more focused: 800+ curated questions across 16 categories, unlimited seats on every plan, month-to-month billing, and integrity that doesn't depend on surveillance. Here's the honest comparison.",
    rows: [
      {
        feature: "Billing commitment",
        vertana: "Monthly or annual, cancel anytime",
        competitor: "Annual-only on paid plans; no monthly option",
      },
      {
        feature: "Free plan",
        vertana: "Yes — $0/mo, 10 candidates/mo, ongoing",
        competitor:
          "Free plan limited to 5 library tests, resume scoring, qualifying questions",
      },
      {
        feature: "Team members",
        vertana: "Unlimited on every plan",
        competitor:
          "2 premium seats on Core; unlimited only on custom-priced Plus",
      },
      {
        feature: "Test library size",
        vertana: "800+ curated questions across 16 categories",
        competitor:
          "350+ tests incl. cognitive, personality, and language tests",
      },
      {
        feature: "Psychometric / personality tests",
        vertana: "Not yet offered",
        competitor: "Included in the core library",
      },
      {
        feature: "Video interviews",
        vertana: "Not yet offered",
        competitor:
          "One-way AI video on Core; conversational AI video on Plus",
      },
      {
        feature: "ATS integrations",
        vertana: "Growth plan and above",
        competitor: "Plus plan only, not available on Core",
      },
      {
        feature: "Approach to AI cheating",
        vertana: "AI-resistant question design + consented monitoring",
        competitor:
          "Disabled copy-paste and cycled question sets; no stated video/AI proctoring",
      },
      {
        feature: "Regional (PPP) pricing",
        vertana: "Yes — automatic purchasing-power pricing in ~90 countries",
        competitor:
          "G2 reviewers in Africa and Latin America cite the annual-only commitment as prohibitive",
      },
    ],
  },
  {
    slug: "vertana-vs-hackerrank",
    competitor: "HackerRank",
    sourceDomain: "hackerrank.com",
    intro:
      "HackerRank is the deep, developer-only standard for coding assessment, with a huge question bank and live interview tooling. Vertana covers technical and non-technical roles at a fraction of the price, with unlimited seats and an ongoing free plan. Here's where each one fits.",
    rows: [
      {
        feature: "Role coverage",
        vertana: "Technical and non-technical roles",
        competitor: "Developer / coding roles only",
      },
      {
        feature: "Pricing model",
        vertana: "$19–39/mo flat, unlimited seats",
        competitor: "$165/mo Starter, $375/mo Pro, billed annually",
      },
      {
        feature: "Free plan",
        vertana: "Yes — $0/mo, 10 candidates/mo, ongoing",
        competitor: "No free plan; free trial only",
      },
      {
        feature: "Team members",
        vertana: "Unlimited on every plan",
        competitor: "Starter capped at 1 user; unlimited only on Pro",
      },
      {
        feature: "Question library",
        vertana: "800+ questions across technical & non-technical roles",
        competitor:
          "2,000+ questions on Starter, 4,000+ on Pro, 55+ languages",
      },
      {
        feature: "Live pair-programming interview tool",
        vertana: "Not offered",
        competitor:
          "Included — shared coding environment for live interviews",
      },
      {
        feature: "AI-assisted IDE for candidates",
        vertana: "Not offered",
        competitor: "Included on Pro",
      },
      {
        feature: "Overage pricing",
        vertana: "Credit packs, no per-attempt penalty",
        competitor: "$20 per attempt beyond the included annual allowance",
      },
      {
        feature: "Approach to AI cheating",
        vertana: "AI-resistant question design + consented monitoring",
        competitor:
          "Plagiarism detection, question-leak protection, AI proctoring on Pro",
      },
      {
        feature: "Regional (PPP) pricing",
        vertana: "Yes — automatic purchasing-power pricing in ~90 countries",
        competitor: "Not offered",
      },
    ],
  },
  {
    slug: "vertana-vs-quilgo",
    competitor: "Quilgo",
    sourceDomain: "quilgo.com",
    note: "A category note first: Quilgo is a proctoring and exam-delivery layer bolted onto Google Forms, Moodle, and Classroom — not a hiring platform. If you already run assessments through Google Forms and just need monitoring, Quilgo fits. If you need a question bank, scoring, and a candidate ranking dashboard in one place, that's a different product. Here's the honest comparison.",
    intro:
      "Vertana is a full hiring platform: you build or generate the questions, candidates take them, and results come back ranked. Quilgo adds a timer and proctoring on top of tools you already use. The table below reflects that difference rather than pretending they're the same category.",
    rows: [
      {
        feature: "What it is",
        vertana:
          "Full hiring platform: question bank, scoring, candidate dashboard",
        competitor: "Proctoring layer for Google Forms, Moodle, and Classroom",
      },
      {
        feature: "Built-in question library",
        vertana: "Yes — 800+ curated questions across 16 categories",
        competitor:
          "None — you bring your own via Google Forms or Moodle",
      },
      {
        feature: "Candidate ranking dashboard",
        vertana: "Yes, built in",
        competitor: "Relies on the host platform's own reporting",
      },
      {
        feature: "Pricing model",
        vertana:
          "$19–39/mo flat, unlimited seats and candidates via credits",
        competitor:
          "$30 / $75 / $145 per month ($24 / $60 / $116 annually)",
      },
      {
        feature: "Free plan",
        vertana: "Yes — $0/mo, 10 candidates/mo, ongoing",
        competitor: "Free trial only (first 20 tests), then paid",
      },
      {
        feature: "Track record",
        vertana: "New entrant",
        competitor: "30M+ exams hosted across 80+ countries",
      },
      {
        feature: "LMS integrations",
        vertana: "Not applicable",
        competitor: "Certified integrations for Moodle and Google Classroom",
      },
      {
        feature: "Mobile test-taking app",
        vertana: "Not offered",
        competitor: "iOS app available",
      },
    ],
  },
]

export function getComparison(slug: string) {
  return COMPARISONS.find((c) => c.slug === slug)
}
