import { BLOG_SOURCES } from "@/lib/marketing/blog-eeat"
import type { BlogPost } from "./types"

export const TAKE_HOME_TESTS_VS_LIVE_CODING: BlogPost = {
  slug: "take-home-tests-vs-live-coding",
  title: "Take-home tests vs. live coding: which should you use?",
  category: "Comparisons",
  intent: "take home assignment vs live coding interview",
  excerpt:
    "Take-home vs live coding: compare signal, candidate burden, and cheating risk by role and stage. Decision table for combining both without over-testing.",
  publishedAt: "2026-06-10",
  updatedAt: "2026-07-19",
  experienceNote:
    "Teams that adopted a short scored screen before any live session reported spending live time on clarification and collaboration instead of basic competence checks — the rubric stayed identical across both stages.",
  sources: [BLOG_SOURCES.schmidtHunter1998, BLOG_SOURCES.eeocUniformGuidelines],
  relatedPostSlugs: [
    "how-to-assess-frontend-engineers",
    "prevent-cheating-remote-technical-interviews",
    "structured-hiring-reduces-bias",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "There is no universally correct assessment format — only the right format for a given role, hiring stage, and candidate pool. The debate between take-home tests and live coding usually collapses into preferences ('I learned better in take-homes') rather than decisions grounded in signal, fairness, and time cost. This comparison gives you a decision framework and a stage-by-stage playbook so you can choose deliberately instead of copying whatever your last employer did.",
    },
    {
      type: "paragraph",
      text: "Both formats can support structured, job-related evaluation when you score against predefined rubrics. Schmidt and Hunter's meta-analytic summary of selection methods emphasizes that structured work samples and tests outperform unstructured interviews when content maps to job requirements and scoring is consistent — the format matters less than whether you standardize what you measure and how you measure it.",
    },
    {
      type: "heading",
      text: "Decision table: format vs role and stage",
    },
    {
      type: "paragraph",
      text: "Use this table as a starting point. Adjust for your bar, market, and legal context. 'Primary' means the format should carry most of the skill signal at that stage; 'Secondary' means use it for depth on finalists; 'Avoid' means poor signal-to-burden ratio unless you have a specific reason.",
    },
    {
      type: "bullets",
      items: [
        "Junior IC, screening — Take-home: Secondary (short, 90 min max). Live coding: Avoid as first filter. Better: timed structured screen with fundamentals + one small coding item.",
        "Junior IC, finalist — Take-home: Optional deep dive. Live coding: Primary for collaboration and clarifying questions, anchored to same rubric as screen.",
        "Mid-level IC, screening — Take-home: Avoid long projects. Live coding: Avoid (too much interviewer time). Primary: async structured assessment, 45–60 min, mixed format.",
        "Mid-level IC, finalist — Take-home: Secondary if role involves unsupervised delivery. Live coding: Primary for debugging conversation and trade-offs.",
        "Senior / staff IC, screening — Take-home: Avoid before mutual interest is established. Live coding: Secondary. Primary: scoped scenario assessment (architecture memo + small code fix).",
        "Senior / staff IC, finalist — Take-home: Primary only if realistic slice (2–4 hrs) with unique context. Live coding: Primary for ambiguous problem framing and cross-functional communication.",
        "High-volume university hiring — Take-home: Avoid (burden scales badly). Live coding: Avoid early. Primary: identical timed screen for all; live only top decile.",
        "Contract / short engagement — Take-home: Primary if paid or very short. Live coding: Primary if integration-heavy role; keep to 30–45 min.",
      ],
    },
    {
      type: "heading",
      text: "What take-home tests do well",
    },
    {
      type: "bullets",
      items: [
        "Show realistic work — candidates use their own tools, IDE setup, and debugging workflow.",
        "Respect different working styles and reduce performance anxiety from live observation.",
        "Scale efficiently — no interviewer calendar time required to administer the first pass.",
        "Surface writing quality and commit hygiene when you ask for a short README or decision log.",
        "Allow deeper problems that cannot fit in a 45-minute live slot without rushing.",
      ],
    },
    {
      type: "heading",
      text: "Where take-homes fall short",
    },
    {
      type: "bullets",
      items: [
        "Harder to verify authorship without integrity signals and unique contextual prompts.",
        "Scope creep — 'just another hour' projects become unpaid multi-day work and harm employer brand.",
        "Miss real-time reasoning — you see the artifact, not how they navigated ambiguity.",
        "Bias risk if reviewers unconsciously reward polish (design, README voice) over rubric criteria.",
        "Drop-off — strong candidates with competing offers may skip unpaid lengthy assignments.",
      ],
    },
    {
      type: "heading",
      text: "What live coding does well",
    },
    {
      type: "bullets",
      items: [
        "Reveals thinking in real time — debugging path, questions asked, response to hints.",
        "Harder to outsource live when pairing is genuine and problems are contextual.",
        "Assesses communication and collaboration directly — critical for team-based delivery.",
        "Lets interviewers probe weak rubric rows immediately instead of guessing from static code.",
        "Reduces take-home authorship concerns when used as a follow-up on the same problem theme.",
      ],
    },
    {
      type: "heading",
      text: "Where live coding falls short",
    },
    {
      type: "bullets",
      items: [
        "Interviewer variance — without a rubric, two interviewers produce incompatible scores.",
        "Scale — engineering time is expensive; live-first pipelines bottleneck on calendar.",
        "Anxiety and stereotype threat — performance under observation may not match on-the-job output.",
        "Algorithm puzzle drift — live sessions often revert to trivia unrelated to daily work.",
        "Scheduling friction — disproportionately excludes caregivers and international candidates.",
      ],
    },
    {
      type: "heading",
      text: "Signal per minute: how to compare formats fairly",
    },
    {
      type: "paragraph",
      text: "Estimate signal per minute for everyone involved — candidate prep, candidate execution, interviewer time, reviewer time. A two-hour take-home might produce high skill signal but costs four to six hours of candidate time with prep and context switching. A 45-minute live session might produce moderate signal but costs two interviewers 45 minutes plus 30 minutes of calibration overhead.",
    },
    {
      type: "callout",
      title: "The pragmatic answer",
      text: "Do not ask which format is better globally. Ask which format delivers the most job-related signal per minute of everyone's time at this stage — then use the same rubric if both formats appear in your funnel.",
    },
    {
      type: "bullets",
      items: [
        "Screening goal — maximize breadth cheaply; prefer timed structured async with executable checks.",
        "Finalist goal — maximize depth on communication and ambiguity; prefer live or paid realistic take-home.",
        "Cheating risk high — shorten take-home scope, add unique context, use integrity flags; do not rely on honor code alone.",
        "Candidate market tight — reduce unpaid hours; paid take-homes or live-only late stages preserve completion rates.",
      ],
    },
    {
      type: "heading",
      text: "Combining both without over-testing",
    },
    {
      type: "paragraph",
      text: "The highest-signal pipelines rarely choose exclusively. A common pattern: identical 45–60 minute structured screen for all applicants; reviewers score against a published rubric; top quartile invited to 45 minute live session extending the same problem domain (not a brand-new puzzle). Candidates experience continuity — the live session feels like a fair follow-up, not a bait-and-switch.",
    },
    {
      type: "paragraph",
      text: "For frontend roles specifically, the screening stage might include one applied coding item from a pool of 72 frontend-engineering questions (19 coding tasks in Vertana's library) plus a written trade-off prompt. Finalists live-debug a related component with intentional ambiguity. Both stages score against the same component-structure and state-management rows.",
    },
    {
      type: "heading",
      text: "Comparison checklist before you change format",
    },
    {
      type: "bullets",
      items: [
        "Does each task map to a documented job responsibility?",
        "Is the rubric defined before candidates start, with calibration examples?",
        "Are time expectations explicit and bounded?",
        "If take-home, is scope ≤ 2–3 hours of focused work unless paid?",
        "If live, are interviewers trained to score behaviors, not vibes?",
        "Are integrity disclosures and consent handled before monitoring begins?",
        "Can you explain the format choice to a candidate who asks why?",
      ],
    },
    {
      type: "heading",
      text: "Fairness and compliance notes",
    },
    {
      type: "paragraph",
      text: "Switching formats mid-funnel for individual candidates without documented reason undermines comparability. The Uniform Guidelines on Employee Selection Procedures expect consistent application of selection tools and job-relatedness evidence. If take-homes disproportionately exclude protected groups because of unpaid time burden, that adverse impact may require justification or process change even when your intentions were neutral.",
    },
    {
      type: "heading",
      text: "Paid take-homes and employer brand",
    },
    {
      type: "paragraph",
      text: "Unpaid four-hour take-homes signal that your company undervalues candidate time — strong applicants with competing offers drop out. If you need deep async work, pay a flat fee or cap scope ruthlessly at two hours of focused effort. Paid assignments also reduce authorship ambiguity somewhat: candidates treat them like contract micro-work and produce more representative output. The decision table above still applies; payment does not remove the need for rubrics or integrity disclosure.",
    },
    {
      type: "heading",
      text: "Where Vertana fits (optional)",
    },
    {
      type: "paragraph",
      text: "Disclosure: Vertana is our product. The decision framework above is format-agnostic. If you use our platform, you can run a scored screening test with multiple-choice, coding, and scenario items from 827 library questions across 22 categories, add consent-first integrity signals, then walk into finalist conversations with rubric scores already in hand. Live sessions stay human-led — we focus on making the async stage structured and comparable.",
    },
  ],
  related: [
    { label: "Test builder", href: "/features/test-builder" },
    { label: "Results and reporting", href: "/features/results-reporting" },
    { label: "For recruiters", href: "/use-cases/recruiters" },
  ],
}
