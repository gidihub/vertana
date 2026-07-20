import { BLOG_SOURCES } from "@/lib/marketing/blog-eeat"
import type { BlogPost } from "./types"

export const AI_RESISTANT_INTERVIEW_QUESTIONS: BlogPost = {
  slug: "ai-resistant-interview-questions",
  title: "What makes an interview question AI-resistant?",
  category: "Hiring science",
  intent: "AI-proof interview questions",
  excerpt:
    "AI-resistant questions bind to context: broken systems, trade-offs, executable code. Design patterns, example stems, and resistance tagging for screens.",
  publishedAt: "2026-07-08",
  updatedAt: "2026-07-19",
  experienceNote:
    "We tag every generated library item high, medium, or low resistance during curation — the exercise surfaced how many 'hard' questions were only hard because they tested obscure vocabulary, not because they required genuine problem solving.",
  sources: [BLOG_SOURCES.schmidtHunter1998],
  relatedPostSlugs: [
    "hiring-in-the-age-of-ai-cheating",
    "how-to-assess-frontend-engineers",
    "prevent-cheating-remote-technical-interviews",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "AI-resistant does not mean obscure. A question about a niche API from 2014 may stump a candidate and still be trivially answerable by a model with the right retrieval context. Resistance means the prompt binds to specific context you supply — a broken system, an ambiguous metric, a constrained timeline, a partial codebase — so a generic best-practice essay scores poorly on your rubric even if it reads fluently.",
    },
    {
      type: "paragraph",
      text: "This guide explains design patterns, example stems, tagging discipline, and how to balance resistance with fairness and job-relatedness. Structured assessments that use resistant content still benefit from the validity advantages of standardized evaluation described in Schmidt and Hunter (1998) — resistance improves content quality within that frame, it does not replace rubrics.",
    },
    {
      type: "heading",
      text: "The three resistance levels",
    },
    {
      type: "paragraph",
      text: "Vertana tags every item in our generated library as high, medium, or low AI resistance. Across 827 questions in 22 category files, the current split is 241 high, 475 medium, and 111 low. Use these definitions when auditing your own content or ours.",
    },
    {
      type: "bullets",
      items: [
        "Low — definitional recall, widely documented facts, single canonical answer. Useful for coverage, risky as a primary screen filter in 2026.",
        "Medium — applied scenarios with some generatable structure; resistance comes from stack-specific details, numeric constraints, or multi-step reasoning.",
        "High — binds tightly to supplied artifacts (code, logs, metrics); often includes executable checks, hidden tests, or rubric-scored trade-offs without one correct essay.",
      ],
    },
    {
      type: "heading",
      text: "Patterns that produce high resistance",
    },
    {
      type: "bullets",
      items: [
        "Broken-state debugging with specific symptoms — 'After this deploy, p95 latency doubled only for checkout; here is a trace snippet.'",
        "Prioritization under constraints — 'Two days until release; three bugs, one missing feature; justify your order.'",
        "Explain-your-trade-off prompts — 'Choose A or B for session storage; defend with security and UX implications for our mobile web app.'",
        "Executable coding with hidden edge cases — starter code looks correct but fails tests candidates cannot see upfront.",
        "Counterfactual follow-ups — 'If we change line 12 to async, what breaks in your solution and why?'",
        "Data-bound reasoning — provide a small table or chart; ask for interpretation, not definition.",
        "Incomplete requirements — force clarifying questions (live) or document assumptions (async).",
      ],
    },
    {
      type: "heading",
      text: "Patterns that look hard but resist poorly",
    },
    {
      type: "bullets",
      items: [
        "Long algorithm puzzles unrelated to daily work — models train on similar problems.",
        "Trivia about version-specific syntax unless tied to a migration scenario you provide.",
        "Open-ended 'design Twitter' without constraints — generates generic architecture essays.",
        "Behavioral questions with stock STAR templates — fluency without verification.",
        "Copy-paste coding from public repos as the entire task — solution may exist online.",
      ],
    },
    {
      type: "heading",
      text: "Example stems by discipline",
    },
    {
      type: "paragraph",
      text: "Adapt placeholders to your stack. Resistance comes from the bracketed context you insert, not from clever wording alone.",
    },
    {
      type: "bullets",
      items: [
        "Frontend — '[Component file provided] Users report focus traps in the modal after route change. Fix and explain the lifecycle interaction causing it.'",
        "Backend — '[Log excerpt provided] Error rate spikes 3% on shard 2 only; outline investigation before proposing a schema change.'",
        "DevOps — '[Pipeline YAML provided] Builds pass but deploy artifacts differ from local; identify two failure modes and how you would confirm each.'",
        "Data — '[Query plan provided] This report timed out after the index drop; propose a fix and a rollback plan if the fix fails overnight.'",
        "Security — '[HTTP trace provided] Identify the likely vulnerability class and one compensating control that does not require full rewrite.'",
        "Applied aptitude — Seven leaf categories in our library host reasoning scenarios; prefer constraint-satisfaction prompts over vocabulary.",
      ],
    },
    {
      type: "heading",
      text: "Scoring resistant questions fairly",
    },
    {
      type: "paragraph",
      text: "Resistance without rubrics produces arguments, not hiring signal. Define rows separately for correctness, reasoning quality, communication, and edge-case awareness. A partially correct high-resistance submission may outscore a fluent wrong guess — if your rubric says so explicitly.",
    },
    {
      type: "callout",
      title: "Resistance is not an excuse for trick questions",
      text: "Every resistant prompt should map to a job task incumbents actually perform. Contextual difficulty is fair; gotcha difficulty erodes trust and weakens job-relatedness defenses.",
    },
    {
      type: "bullets",
      items: [
        "Correctness row — tests pass, bug fixed, metric interpretation accurate.",
        "Reasoning row — hypotheses stated, alternatives considered, risks named.",
        "Communication row — clear structure, appropriate depth for seniority band.",
        "Pragmatism row — solution proportionate to stated timeline and scope.",
      ],
    },
    {
      type: "heading",
      text: "Tagging workflow for internal question banks",
    },
    {
      type: "paragraph",
      text: "If you maintain questions in spreadsheets or a CMS, add a resistance column and review it quarterly. When generative models improve, some medium items drop to low — retag or retire them. When you add executable checks, low items may move to medium.",
    },
    {
      type: "bullets",
      items: [
        "Step 1 — Attempt the question with a general-purpose model using only the candidate-facing prompt.",
        "Step 2 — Score the model output against your rubric without cheating yourself — if it earns passing marks, raise resistance or add verification.",
        "Step 3 — Record tag, date, and reviewer initials for auditability.",
        "Step 4 — For screening templates, enforce minimum share of high/medium items (many teams target ≥70% combined weight).",
      ],
    },
    {
      type: "heading",
      text: "Mixing resistance across assessment stages",
    },
    {
      type: "paragraph",
      text: "Early async screens should weight high resistance heavily — you have limited proctoring context and high candidate volume. Later stages can reintroduce medium items with live probing. Low-resistance fundamentals still help map knowledge gaps for onboarding plans even if they should not gate entry alone.",
    },
    {
      type: "paragraph",
      text: "Frontend-engineering screens can draw from 72 library items including 19 coding tasks; bias early draws toward high-resistance applied tasks, then use medium fundamentals to fill specific skill gaps identified in review.",
    },
    {
      type: "heading",
      text: "Integrity signals complement resistant design",
    },
    {
      type: "paragraph",
      text: "Even strong stems leak over time. Rotate pools, randomize order, and monitor integrity with consent. Resistance reduces payoff from cheating; it does not eliminate sharing of specific prompts. Combine design with lightweight proctoring flags reviewed by humans — covered in our remote integrity guide.",
    },
    {
      type: "heading",
      text: "Accessibility and resistance together",
    },
    {
      type: "paragraph",
      text: "Timed high-resistance tasks can disadvantage candidates who use assistive technology if platforms are incompatible or timers ignore accommodation needs. Offer extended time where legally required, test your delivery environment with screen readers for fundamental fairness, and never use integrity false positives as a substitute for resistant design.",
    },
    {
      type: "heading",
      text: "Rotating pools and leakage control",
    },
    {
      type: "paragraph",
      text: "Even high-resistance stems appear on sharing sites eventually. Maintain multiple equivalent items per rubric row, rotate draws per cohort, and change contextual details seasonally — metric names, file paths, numeric thresholds. When an item leaks, retire it from active pools but keep it for calibration history. Leakage is a maintenance problem, not a one-time authoring task.",
    },
    {
      type: "bullets",
      items: [
        "Maintain at least two parallel items per critical rubric row where possible.",
        "Log which pool version each candidate saw for post-hoc analysis.",
        "After public exposure, demote the item to practice-only or rewrite context.",
        "Pair pool rotation with time boxes so memorized answers miss hidden follow-ups.",
      ],
    },
    {
      type: "heading",
      text: "Building resistance into generated content",
    },
    {
      type: "paragraph",
      text: "If you use AI-assisted question authoring internally, enforce a human review gate: every generated stem must receive a resistance tag and a job-task mapping before publication. Automated authoring accelerates throughput but defaults toward generic wording unless reviewers inject contextual anchors — logs, stack traces, partial implementations. Our library workflow treats tagging as mandatory metadata, not an optional label, because untagged items silently regress screens toward low-resistance recall.",
    },
    {
      type: "heading",
      text: "Review questions for your own bank",
    },
    {
      type: "paragraph",
      text: "Before your next req opens, pick ten existing screening questions and score each against the patterns above. If more than three are low resistance by the definitions in this guide, schedule a rewrite sprint. Involve an engineer who actually performs the job tasks — they spot generic stems faster than recruiters alone. The goal is not perfection on day one; it is a measurable upward shift in resistance mix quarter over quarter.",
    },
    {
      type: "paragraph",
      text: "Resistance tagging is most valuable when recruiters can filter library search results by level and format. Without metadata, teams revert to familiar low-resistance stems because they are easy to find. Treat tags as required fields alongside difficulty and category so screening templates inherit a defensible mix by default rather than by manual audit every hire cycle.",
    },
    {
      type: "heading",
      text: "Where Vertana fits (optional)",
    },
    {
      type: "paragraph",
      text: "Disclosure: Vertana is our product. The patterns above work in any well-run process. Our question library ships with resistance tags, mixed formats, and executable coding templates across 22 categories so recruiters can build high-signal screens without rewriting every stem from scratch. Tagging is a means to consistent screening — not a substitute for rubrics, consent, or human review.",
    },
  ],
  related: [
    { label: "Question library", href: "/library" },
    { label: "Backend engineer assessment", href: "/assessments/backend-engineer-assessment" },
    { label: "Test builder", href: "/features/test-builder" },
  ],
}
