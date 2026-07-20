import { BLOG_SOURCES } from "@/lib/marketing/blog-eeat"
import type { BlogPost } from "./types"

export const HIRING_IN_THE_AGE_OF_AI_CHEATING: BlogPost = {
  slug: "hiring-in-the-age-of-ai-cheating",
  title: "Hiring in the age of AI cheating: a practical playbook",
  category: "Guides",
  intent: "AI cheating in hiring assessments",
  excerpt:
    "AI lowers cheating friction in hiring. Use resistance-tagged questions, sandboxed coding, consent-first integrity signals, formats where pasted answers fail.",
  publishedAt: "2026-07-10",
  updatedAt: "2026-07-19",
  featured: true,
  experienceNote:
    "Tagging our generated library by AI resistance forced explicit design conversations: items labeled low were almost always definitional recall that we now exclude from first-round screens unless paired with an applied follow-up.",
  sources: [
    BLOG_SOURCES.gdprOverview,
    BLOG_SOURCES.euAiAct,
    BLOG_SOURCES.eeocUniformGuidelines,
  ],
  relatedPostSlugs: [
    "ai-resistant-interview-questions",
    "prevent-cheating-remote-technical-interviews",
    "reduce-bias-structured-skills-assessments",
  ],
  blocks: [
    {
      type: "paragraph",
      text: "Generative AI did not invent cheating — candidates have always had books, colleagues, and prior question leaks. What changed in the last few years is friction: a pasted prompt returns a fluent, confident answer in seconds, and detection tools chase a moving target. The sustainable response is not to ban laptops or pretend AI does not exist. It is to design assessments where generic model output fails, integrity monitoring is consent-first, and hiring decisions still rest on job-related evidence scored consistently.",
    },
    {
      type: "paragraph",
      text: "This playbook is for teams running technical screens at scale in 2026. It connects question design, format choice, proctoring philosophy, and compliance basics without promising magic detection scores. Every tactic here assumes human reviewers make final calls.",
    },
    {
      type: "heading",
      text: "Why AI breaks legacy interview content",
    },
    {
      type: "paragraph",
      text: "Most legacy banks overweight definitional questions: explain CAP theorem, list React hook rules, describe the difference between REST and GraphQL. Language models answer these competently even when the candidate has never shipped production software. The failure mode is false positives — you advance articulate non-performers until a live project exposes the gap. False negatives also happen when you punish AI-savvy candidates for using legitimate tools you never clarified.",
    },
    {
      type: "bullets",
      items: [
        "Low-resistance recall — single correct paragraph, easily generated.",
        "Medium-resistance applied — needs context but still partially generatable with a good prompt.",
        "High-resistance contextual — binds to broken state, proprietary constraints, executable checks, or ambiguous trade-offs.",
      ],
    },
    {
      type: "paragraph",
      text: "In Vertana's generated library of 827 questions across 22 category files, AI resistance tags currently break down as 241 high, 475 medium, and 111 low. Screening stages should be predominantly high and medium resistance; low-resistance items can supplement coverage but must not dominate pass/fail decisions.",
    },
    {
      type: "heading",
      text: "What still produces signal in 2026",
    },
    {
      type: "bullets",
      items: [
        "Coding questions with hidden test cases — output must run, not just read well on screen.",
        "Scenario judgment with trade-offs — no single correct essay; rubric scores reasoning quality.",
        "Timed, mixed-format tests — prioritization and partial completion reveal process, not just final artifacts.",
        "Broken-state debugging — candidates must interact with a specific codebase snippet you provide.",
        "Follow-up prompts — ask for prediction of failure mode given a one-line change to their own answer.",
        "Integrity monitoring with explicit consent — focus timelines as review flags, not auto-fail.",
      ],
    },
    {
      type: "heading",
      text: "Playbook stage 1: Clarify policy before content",
    },
    {
      type: "paragraph",
      text: "Candidates cannot follow rules you never stated. Publish whether external AI assistants, documentation, or human help is allowed for each stage. Many teams allow open documentation but prohibit live AI code generation for timed screens — whatever you choose, apply it consistently and align integrity monitoring so allowed behaviors do not generate false flags.",
    },
    {
      type: "callout",
      title: "Policy clarity reduces false flags",
      text: "Ambiguous rules produce noisy integrity signals and angry candidates. One paragraph in the invitation email prevents more disputes than any detection algorithm.",
    },
    {
      type: "heading",
      text: "Playbook stage 2: Rebalance your item mix",
    },
    {
      type: "paragraph",
      text: "Audit existing questions against resistance criteria. If more than a quarter of screening weight sits on low-resistance recall, expect AI inflation. Replace with applied stems tied to your stack: fix this component, prioritize this backlog under a two-day deadline, explain why this metric moved after deploy.",
    },
    {
      type: "bullets",
      items: [
        "Frontend example — Given this React tree and profiler screenshot, name the most likely re-render cause and propose a minimal fix.",
        "Backend example — This endpoint times out at 10k rows; outline investigation steps before writing code.",
        "Applied aptitude example — Seven leaf categories in our library cover reasoning patterns; use scenario trade-offs, not vocabulary quizzes.",
        "Remove or demote — Standalone definitions that appear verbatim in model training summaries.",
      ],
    },
    {
      type: "heading",
      text: "Playbook stage 3: Executable verification",
    },
    {
      type: "paragraph",
      text: "Free-text answers are the easiest to forge. Sandboxed coding with hidden tests forces candidates to produce running code under constraints. Pair executable tasks with short written justifications scored on rubric rows separate from correctness — models can code boilerplate but often stumble when asked to predict behavior under a specific edge case you introduce after the first submission.",
    },
    {
      type: "paragraph",
      text: "The frontend-engineering leaf in our library includes 72 questions, 19 of which are coding tasks with automated checks — useful templates for what executable screening looks like in UI-heavy roles.",
    },
    {
      type: "heading",
      text: "Playbook stage 4: Integrity signals with consent",
    },
    {
      type: "paragraph",
      text: "Monitoring without disclosure destroys trust and may violate GDPR transparency requirements. Tell candidates what is collected — focus events, optional camera check-in, paste heuristics — before they start, and store consent metadata with the attempt. Treat signals as flags for human review: a burst of tab switches plus generic prose triggers a closer read, not an automatic rejection.",
    },
    {
      type: "paragraph",
      text: "The EU AI Act pushes employment-related automated systems toward documented oversight. Even if your jurisdiction differs, designing for human review future-proofs your process and reduces harm from false positives on candidates using assistive technology or dealing with unstable home networks.",
    },
    {
      type: "heading",
      text: "Playbook stage 5: Structured scoring survives AI pressure",
    },
    {
      type: "paragraph",
      text: "AI cheating is partly a measurement problem. Unstructured interviews let polished language substitute for skill. Structured rubrics score specific behaviors — did they handle the empty state, did they mention rollback, did tests pass — reducing the payoff of generic fluency. Schmidt and Hunter's summary of selection method validity supports structured work samples over unstructured conversation when job relevance is high; AI does not repeal that math.",
    },
    {
      type: "callout",
      title: "Positioning principle",
      text: "Treat AI resistance as a first-class design constraint for screening content — not a footnote on individual questions added after the fact.",
    },
    {
      type: "heading",
      text: "What not to do",
    },
    {
      type: "bullets",
      items: [
        "Arms-race detection as sole strategy — false positives and adversarial adaptation make this brittle.",
        "Trick questions with no job mapping — hurt employer brand without improving signal.",
        "Auto-reject on telemetry — legally and ethically risky; disproportionately affects marginalized candidates.",
        "Assume live interviews are AI-proof — candidates can use secondary devices unless ground rules are explicit.",
        "Cite completion rates from tiny samples as proof — small-n metrics mislead process decisions.",
      ],
    },
    {
      type: "heading",
      text: "Finalist stage: depth without reinventing the wheel",
    },
    {
      type: "paragraph",
      text: "After a structured async screen, use live time for ambiguity and collaboration — extend the same problem domain, introduce a requirement change mid-session, ask how their prior answer would break. Continuity makes AI-assisted memorization less useful because the live prompt is novel yet rubric-aligned.",
    },
    {
      type: "heading",
      text: "Metrics that matter while you iterate",
    },
    {
      type: "bullets",
      items: [
        "Screen-to-finalist yield vs historical baseline — sudden inflation may indicate content leakage or AI vulnerability.",
        "Rubric row variance across reviewers — high variance means AI noise may be masking calibration problems.",
        "Candidate feedback on clarity and fairness — drops often precede public Glassdoor posts.",
        "New-hire performance check-ins at 90 days — ultimate validation of whether resistance tagging worked.",
      ],
    },
    {
      type: "heading",
      text: "Communicating the process to candidates",
    },
    {
      type: "paragraph",
      text: "Candidates hear 'AI monitoring' and assume adversarial surveillance. Reframe: you use structured, job-related tasks so everyone competes on the same evidence, and you disclose any optional integrity signals up front. Share approximate duration, allowed resources, and what reviewers score. Transparency improves completion rates and reduces post-rejection disputes when a flagged attempt is reviewed fairly by a human.",
    },
    {
      type: "bullets",
      items: [
        "Include a one-paragraph integrity summary in the invitation — not only inside the test UI.",
        "State whether AI assistants are allowed; if prohibited, say so plainly.",
        "Offer a contact for accommodations and technical difficulties before the deadline.",
        "After rejection, optional rubric-level feedback ('production judgment row') signals seriousness without revealing items.",
      ],
    },
    {
      type: "heading",
      text: "Where Vertana fits (optional)",
    },
    {
      type: "paragraph",
      text: "Disclosure: Vertana is our product. This playbook stands alone. We built the platform around AI resistance tagging, mixed-format timed assessments, sandboxed coding, consent-first proctoring, and rubric scoring — so teams can implement the stages above without maintaining spreadsheets of item metadata. Mentioning us is optional; the design constraints are not.",
    },
  ],
  related: [
    { label: "Proctoring", href: "/features/proctoring" },
    { label: "React developer assessment", href: "/assessments/react-developer-assessment" },
    { label: "AI question generation", href: "/features/ai-question-generation" },
  ],
}
