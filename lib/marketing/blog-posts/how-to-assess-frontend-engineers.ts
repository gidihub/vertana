import { BLOG_SOURCES } from "@/lib/marketing/blog-eeat"
import type { BlogPost } from "./types"

export const HOW_TO_ASSESS_FRONTEND_ENGINEERS: BlogPost = {
  slug: "how-to-assess-frontend-engineers",
  title: "How to assess frontend engineers: a practical framework",
  category: "Guides",
  intent: "how to test frontend developer skills",
  excerpt:
    "A repeatable rubric framework for evaluating frontend engineers on fundamentals, framework fluency, production judgment, and communication—without trivia.",
  publishedAt: "2026-06-24",
  updatedAt: "2026-07-19",
  experienceNote:
    "When we built our frontend-engineering question leaf, we split items between recall-style fundamentals and applied coding tasks because mixed-format screens consistently surfaced more variance in reviewer calibration sessions than either format alone.",
  sources: [BLOG_SOURCES.schmidtHunter1998, BLOG_SOURCES.eeocUniformGuidelines],
  relatedPostSlugs: [
    "ai-resistant-interview-questions",
    "take-home-tests-vs-live-coding",
    "structured-hiring-reduces-bias",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "Most frontend interviews measure the wrong things. They over-index on algorithm trivia and under-index on the judgment that actually separates a strong engineer from an average one: how they structure components, reason about state, handle edge cases, and ship accessible, performant interfaces under realistic constraints. If your last frontend hire struggled in their first sprint despite a polished whiteboard performance, the assessment probably tested recall instead of production work.",
    },
    {
      type: "paragraph",
      text: "This guide lays out a framework you can reuse for every frontend role, then shows how to turn it into a scored assessment that produces comparable results across candidates and interviewers. The approach aligns with decades of selection research: work-sample and structured evaluation methods tend to outperform unstructured conversation when the tasks map clearly to on-the-job requirements, as summarized in the meta-analytic work of Schmidt and Hunter (1998).",
    },
    {
      type: "heading",
      text: "Start from the work, not the syllabus",
    },
    {
      type: "paragraph",
      text: "Before writing a single question, list the three to five things the person will actually do in their first 90 days. For most frontend roles that looks like building components from a spec, integrating an API, debugging a rendering issue, tightening accessibility, and participating in design review. Every question you write should trace back to one of those tasks. If a question does not map to real work, it adds noise without improving your hire rate.",
    },
    {
      type: "callout",
      title: "Rule of thumb",
      text: "If you cannot name the real task a question maps to, cut it. Trivia inflates perceived difficulty without adding signal, and it is disproportionately easy to prepare for with flashcards or generative AI.",
    },
    {
      type: "heading",
      text: "The four layers worth testing",
    },
    {
      type: "bullets",
      items: [
        "Fundamentals — semantic HTML, CSS layout, and the language features they will use daily (not esoteric spec edge cases).",
        "Framework fluency — component structure, state, and data flow in your actual stack (React, Vue, Svelte, or whatever you ship).",
        "Production judgment — accessibility, performance, error handling, and defensive coding under realistic constraints.",
        "Communication — can they explain a trade-off and justify a decision in writing when there is no single correct answer?",
      ],
    },
    {
      type: "paragraph",
      text: "Weight these by seniority. For a junior role, fundamentals and framework fluency carry most of the score. For a senior role, production judgment and communication should dominate — anyone can center a div by then. Staff-level screens should include system-level prompts: how would they structure a design system token migration, or how would they reduce bundle size across a monorepo without breaking consumer teams?",
    },
    {
      type: "heading",
      text: "Sample rubric rows you can adopt today",
    },
    {
      type: "paragraph",
      text: "Define what a 1, 3, and 5 looks like for each dimension before candidates start. Rubrics are what make results comparable across candidates and interviewers, and they are the single biggest lever for reducing bias in technical hiring. Below is a starter table for a mid-level React role; adapt weights to your stack and seniority band.",
    },
    {
      type: "bullets",
      items: [
        "Component structure (weight 20%) — Score 1: monolithic file, unclear separation of concerns. Score 3: sensible component boundaries, props typed or documented. Score 5: reusable abstractions, clear ownership of side effects, easy to test.",
        "State and data flow (weight 20%) — Score 1: prop drilling without reason or mystery global state. Score 3: appropriate local vs shared state. Score 5: handles async loading, error, and empty states explicitly.",
        "Accessibility (weight 15%) — Score 1: non-semantic markup, missing labels. Score 3: keyboard navigable, basic ARIA where needed. Score 5: focus management, live regions, and documented a11y trade-offs.",
        "Performance awareness (weight 15%) — Score 1: unnecessary re-renders ignored. Score 3: identifies one concrete bottleneck. Score 5: memoization or virtualization justified with measurement, not superstition.",
        "Debugging / applied coding (weight 20%) — Score 1: cannot localize the bug. Score 3: fixes symptom with a plausible explanation. Score 5: root cause identified, fix minimal, mentions regression risk.",
        "Written communication (weight 10%) — Score 1: no explanation or contradictory reasoning. Score 3: clear summary of approach. Score 5: trade-offs, alternatives considered, and follow-up work listed.",
      ],
    },
    {
      type: "paragraph",
      text: "Publish the rubric to interviewers and, where appropriate, share high-level evaluation criteria with candidates. Transparency improves candidate experience and makes your process easier to defend under the Uniform Guidelines on Employee Selection Procedures, which expect selection tools to be job-related and applied consistently.",
    },
    {
      type: "heading",
      text: "Prefer applied tasks over recall",
    },
    {
      type: "paragraph",
      text: "A short, applied task — for example, here is a broken component with a re-render bug; fix it and explain what caused it — tells you far more than a multiple-choice question about hook rules. Applied tasks are harder to game with memorized answers and easier to score consistently against a rubric. They also mirror how frontend engineers actually work: reading unfamiliar code, forming a hypothesis, and validating with tools.",
    },
    {
      type: "callout",
      title: "What strong signal looks like",
      text: "The best predictor of whether someone can do the job is watching them complete a small, realistic slice of the job — then scoring that work against criteria you defined in advance, not against interviewer mood.",
    },
    {
      type: "heading",
      text: "Example question stems by layer",
    },
    {
      type: "bullets",
      items: [
        "Fundamentals — Given this form markup, identify two accessibility failures and rewrite the structure using semantic HTML only (no framework).",
        "Framework fluency — This list component re-renders the entire tree on every keystroke in the search field. Refactor to isolate updates and explain your state placement.",
        "Production judgment — The product team wants infinite scroll on a table with 50k rows. Outline your approach to scrolling, fetching, and memory, including what you would measure before and after.",
        "Communication — You disagree with a design that uses color alone to indicate error states. Write a short message to the designer proposing an alternative that meets WCAG contrast requirements without blocking release.",
        "Applied coding — Implement a debounced search input that cancels in-flight requests when the query changes. Hidden tests include rapid typing, empty query, and network failure.",
      ],
    },
    {
      type: "paragraph",
      text: "Mix two or three stems across layers in a single screen rather than running four hours of live coding. A 45–60 minute structured assessment with a clear rubric often produces more comparable data than an unstructured afternoon of pair programming.",
    },
    {
      type: "heading",
      text: "Format choice: screening vs final-stage depth",
    },
    {
      type: "paragraph",
      text: "Use a scored async or timed screen early to filter for baseline competence, then reserve live sessions for finalists where you probe communication and collaboration. Live coding still has a place — especially for observing how someone asks clarifying questions — but it scales poorly and introduces interviewer variance. If you use live coding, anchor it to the same rubric rows above so async and live scores mean the same thing.",
    },
    {
      type: "bullets",
      items: [
        "Screening (async, 45–60 min) — weighted toward fundamentals, one applied coding item, one short written trade-off prompt.",
        "Finalist live (45 min) — extend the same rubric; add collaborative debugging on a snippet they have not seen, with intentional ambiguity in the requirements.",
        "Avoid — brand-new algorithm puzzles unrelated to UI work, unless the role genuinely spans heavy client-side computation.",
      ],
    },
    {
      type: "heading",
      text: "What our frontend question library covers",
    },
    {
      type: "paragraph",
      text: "Vertana's generated question library currently contains 827 items across 22 category files. The frontend-engineering leaf alone includes 72 questions, of which 19 are coding tasks with executable checks. The remainder spans fundamentals, framework-specific scenarios, and production-judgment prompts tagged for AI resistance. When you build a frontend screen, bias toward applied and high-resistance items for early stages, then use medium-resistance fundamentals to fill coverage gaps.",
    },
    {
      type: "paragraph",
      text: "Across the full library, AI resistance tags break down as 241 high, 475 medium, and 111 low. High-resistance frontend items tend to bind to broken state, proprietary constraints, or multi-step reasoning — not generic definitions that a language model can recite fluently.",
    },
    {
      type: "heading",
      text: "Operational checklist before you launch a frontend assessment",
    },
    {
      type: "bullets",
      items: [
        "Document job-related tasks and map each rubric row to at least one task.",
        "Calibrate rubric scores with two interviewers on the same anonymized submission.",
        "Set time boxes per section so candidates know what finished looks like.",
        "Randomize or pool questions so item exposure is limited across cohorts.",
        "Store rubric versions with each attempt so you can explain scoring later.",
        "Separate skills scoring from culture and values conversations.",
      ],
    },
    {
      type: "heading",
      text: "Where Vertana fits (optional)",
    },
    {
      type: "paragraph",
      text: "Disclosure: Vertana is our product. The framework above stands on its own. If you use our platform, you can encode this rubric directly: mix multiple-choice fundamentals with coding tasks from the frontend-engineering leaf, tag items by AI resistance, and score every submission against the same criteria so rankings reflect ability rather than interviewer mood. None of that is required to run a fair frontend assessment — but it is how we implement the practices described in this guide.",
    },
  ],
  related: [
    { label: "Test builder", href: "/features/test-builder" },
    { label: "For technical teams", href: "/use-cases/technical-teams" },
    { label: "AI question generation", href: "/features/ai-question-generation" },
  ],
}
