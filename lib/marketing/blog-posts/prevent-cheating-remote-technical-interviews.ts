import { BLOG_SOURCES } from "@/lib/marketing/blog-eeat"
import type { BlogPost } from "./types"

export const PREVENT_CHEATING_REMOTE_TECHNICAL_INTERVIEWS: BlogPost = {
  slug: "prevent-cheating-remote-technical-interviews",
  title: "How to prevent cheating in remote technical interviews",
  category: "Compliance",
  intent: "how to stop cheating in online coding tests",
  excerpt:
    "Design remote technical assessments for integrity: consent-first proctoring, randomized pools, and reviewable flags—not auto-verdicts—for fair hiring.",
  publishedAt: "2026-06-17",
  updatedAt: "2026-07-19",
  experienceNote:
    "In early proctoring design reviews we learned that candidates who received a plain-language integrity summary before starting completed assessments at similar rates to unproctored cohorts, while reviewers reported fewer ambiguous edge cases to escalate.",
  sources: [
    BLOG_SOURCES.gdprOverview,
    BLOG_SOURCES.euAiAct,
    BLOG_SOURCES.eeocUniformGuidelines,
    BLOG_SOURCES.vertanaGdpr,
  ],
  relatedPostSlugs: [
    "hiring-in-the-age-of-ai-cheating",
    "ai-resistant-interview-questions",
    "take-home-tests-vs-live-coding",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "Remote hiring is here to stay, and with it comes a practical question: how do you trust a score when you cannot see the room? Heavy-handed surveillance is not the answer — it damages candidate experience, creates legal risk, and still misses sophisticated assistance. The better approach is layered design that makes cheating hard, detectable when it happens, and mostly pointless relative to honest effort.",
    },
    {
      type: "paragraph",
      text: "This guide covers assessment design, consent-first integrity monitoring, and how to treat signals during review. It is written for hiring managers, recruiters, and engineering leaders who need defensible process without treating every candidate like a suspect.",
    },
    {
      type: "heading",
      text: "Design the assessment to resist gaming",
    },
    {
      type: "paragraph",
      text: "Integrity starts with the test itself. If questions are searchable trivia with one obvious answer key, no amount of camera monitoring will save you. Build assessments where success requires executing work, not reciting it.",
    },
    {
      type: "bullets",
      items: [
        "Use large question pools and randomize order so no two candidates see identical item sets.",
        "Favor applied tasks with many valid solutions over lookup-friendly definitions.",
        "Time-box sections so answers cannot be crowdsourced mid-attempt without blowing the clock.",
        "Require written reasoning alongside code — copied answers rarely survive a focused why follow-up.",
        "Include executable checks with hidden edge cases so pasted code must actually run.",
        "Tag items by AI resistance and weight high-resistance prompts in screening stages.",
      ],
    },
    {
      type: "paragraph",
      text: "Vertana's library tags 241 items as high AI resistance, 475 as medium, and 111 as low across 827 generated questions in 22 category files. Screening stages should lean on high-resistance applied tasks; low-resistance fundamentals can fill coverage but should not dominate early filters.",
    },
    {
      type: "heading",
      text: "Consent, disclosure, and GDPR basics",
    },
    {
      type: "paragraph",
      text: "Any integrity monitoring that collects personal data — camera frames at check-in, focus events, IP metadata — triggers transparency and lawful-basis obligations under the GDPR and comparable privacy regimes. Candidates must know what is collected, why, how long it is retained, and who can access it before they begin. When monitoring is genuinely optional, obtain explicit consent and offer a meaningful no-detriment opt-out. When monitoring is required to run the assessment, do not treat consent as a substitute for a lawful basis — identify and document the appropriate basis (often legitimate interests or contract, depending on jurisdiction and role), and show that collection is necessary, proportionate, and limited to what the process requires.",
    },
    {
      type: "callout",
      title: "Consent is non-negotiable for optional monitoring",
      text: "Optional proctoring or extra surveillance requires clear, up-front disclosure in plain language, a real choice with no detriment for declining, and a stored consent version and timestamp on every attempt. Required assessment monitoring still needs the same transparency — plus a documented lawful basis, necessity and proportionality rationale, retention limits, and a path for candidates to exercise their rights.",
    },
    {
      type: "bullets",
      items: [
        "Publish an integrity summary before the start button — not buried in terms of service.",
        "Separate required assessment data from optional proctoring signals in your privacy notice.",
        "Document the lawful basis, retention periods, and deletion workflows for each signal type.",
        "Give candidates a contact for privacy questions; route EU requests through your DPO or designated representative.",
        "Review vendor subprocessors if you use third-party proctoring — data processing agreements matter.",
      ],
    },
    {
      type: "paragraph",
      text: "The EU AI Act adds further scrutiny when automated systems influence employment decisions. High-risk categorization depends on your exact deployment, but the direction is clear: human oversight, transparency, and documented evaluation of systemic bias are becoming baseline expectations — not optional polish. Pair technical monitoring with human review of flagged attempts.",
    },
    {
      type: "heading",
      text: "Add proctoring signals, with proportionality",
    },
    {
      type: "paragraph",
      text: "Lightweight integrity signals — identity verification at start, focus and tab-switch tracking during the test, copy-paste heuristics — catch obvious cases without recording someone's living room for an hour. Proportionality matters: a 45-minute skills screen does not need continuous video surveillance; a brief check-in snapshot plus event telemetry is often enough to prioritize review.",
    },
    {
      type: "bullets",
      items: [
        "Camera or ID check at start only — not continuous recording for standard technical screens.",
        "Tab focus and visibility events — surfaced as a timeline, not a hidden score penalty.",
        "Session environment metadata — browser, timezone drift — as context, not guilt.",
        "Plagiarism and similarity hints — route to human review, never silent rejection.",
      ],
    },
    {
      type: "heading",
      text: "Treat signals as flags, not verdicts",
    },
    {
      type: "paragraph",
      text: "A tab switch is not proof of cheating. Someone may have checked documentation you allowed, a notification may have popped up, or a browser extension may have stolen focus. Integrity signals should prioritize which submissions get a closer human look — never auto-reject on telemetry alone. This keeps the process fair, auditable, and aligned with the Uniform Guidelines expectation that selection decisions be job-related and consistently applied.",
    },
    {
      type: "callout",
      title: "Review workflow that scales",
      text: "The goal is not to catch people — it is to make the honest path the easy path, and to give reviewers a short list of attempts worth a second read when something looks off.",
    },
    {
      type: "bullets",
      items: [
        "Flag tier 1 (auto-queue for review) — multiple long unfocused intervals plus high similarity on written answers.",
        "Flag tier 2 (optional review) — single tab blur during a fundamentals section with otherwise strong unique code.",
        "No flag — consistent focus, original reasoning, code passes hidden tests with idiomatic structure.",
        "Escalation — human compares flagged timeline against submission quality; may request short follow-up call.",
      ],
    },
    {
      type: "heading",
      text: "Remote format-specific risks",
    },
    {
      type: "paragraph",
      text: "Take-home assignments carry higher authorship risk because candidates control their environment for hours. Mitigate with narrower scope (two hours max of focused work), unique prompts with contextual details, and the same integrity signals where your platform supports them. Live coding reduces real-time outsourcing but introduces interviewer variance — use live sessions late, anchored to the same rubric used in async stages.",
    },
    {
      type: "paragraph",
      text: "Generative AI assistance blurs the line between open-book research and misrepresentation. Design prompts where generic model output fails: ambiguous requirements, broken starting code, prioritization under constraints, and executable tasks with non-obvious edge cases. Our separate guide on AI-resistant question patterns goes deeper on stem design.",
    },
    {
      type: "heading",
      text: "Candidate experience and fairness",
    },
    {
      type: "paragraph",
      text: "Candidates talk. A process that feels adversarial loses strong applicants who have other offers. Explain why you monitor integrity — you are protecting everyone who invested honest effort — and keep monitoring minimal relative to the role level. Junior screens need less surveillance than high-stakes final rounds with sensitive code, but every stage needs the same transparency standard.",
    },
    {
      type: "bullets",
      items: [
        "Offer practice or sample questions so format surprises do not read as traps.",
        "State whether external documentation is allowed; inconsistency invalidates focus flags.",
        "Accommodate disabilities and caregiving interruptions — integrity review must allow context.",
        "Log reviewer decisions on flagged attempts to improve calibration over time.",
      ],
    },
    {
      type: "heading",
      text: "Documentation you will want if a decision is challenged",
    },
    {
      type: "paragraph",
      text: "If a hiring decision is questioned, regulators and courts care about job-relatedness, consistency, and whether monitoring was disclosed. Keep records linking the assessment version, rubric, integrity summary shown to the candidate, consent timestamp, submission, reviewer notes, and final decision rationale. Structured documentation is easier to produce when your tooling stores versions by default.",
    },
    {
      type: "heading",
      text: "Regional and legal context for monitoring",
    },
    {
      type: "paragraph",
      text: "Teams hiring across borders should treat privacy notices and lawful bases as part of assessment design, not legal afterthoughts. GDPR requires transparency about processing purposes and retention; candidates in the EU may have rights to access or delete proctoring logs depending on your implementation. Document which subprocessors touch integrity data and link to your GDPR overview from the consent screen. Employment-related automated scoring under the EU AI Act may require additional risk management — exact obligations depend on deployment — but human review of flagged attempts aligns with the direction of travel.",
    },
    {
      type: "heading",
      text: "Where Vertana fits (optional)",
    },
    {
      type: "paragraph",
      text: "Disclosure: Vertana is our product. The practices above stand alone. Our proctoring is built consent-first: camera verification at start, focus tracking, randomized pools from the tagged question library, and integrity timelines surfaced for human review — not silent auto-rejections. See our GDPR overview for how we handle retention and subprocessors. You can run a fair remote process without us; this is how we implement the model described here.",
    },
  ],
  related: [
    { label: "Proctoring", href: "/features/proctoring" },
    { label: "For remote hiring", href: "/use-cases/remote-hiring" },
    { label: "GDPR compliance", href: "/legal/gdpr" },
  ],
}
