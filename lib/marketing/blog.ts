// Blog content model for Vertana's resource hub.
//
// Posts are intentionally intent-first: each maps to a real search intent
// cluster (informational, comparison, trust/compliance) and links out to the
// relevant product/use-case pages so articles route readers to a solution.
//
// Content is authored as a list of typed blocks so the article template can
// render rich layouts (headings, bullets, callouts, quotes) without a CMS.

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "callout"; title: string; text: string }
  | { type: "quote"; text: string; cite?: string }

export interface BlogRelatedLink {
  label: string
  href: string
}

export interface BlogPost {
  slug: string
  title: string
  // The search intent this post targets, shown as a chip. Also used for
  // grouping and filtering on the index.
  category: "Guides" | "Comparisons" | "Compliance" | "Hiring science"
  // One-line search-intent framing, e.g. the query a reader might type.
  intent: string
  excerpt: string
  author: string
  role?: string
  date: string // ISO date
  readMinutes: number
  featured?: boolean
  blocks: BlogBlock[]
  related: BlogRelatedLink[]
}

export const BLOG_AUTHOR = "Vertana team"

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-assess-frontend-engineers",
    title: "How to assess frontend engineers: a practical framework",
    category: "Guides",
    intent: "how to test frontend developer skills",
    excerpt:
      "A repeatable framework for evaluating real frontend ability — from fundamentals to production judgment — without leaning on trivia or whiteboard puzzles.",
    author: BLOG_AUTHOR,
    date: "2026-06-24",
    readMinutes: 8,
    featured: false,
    blocks: [
      {
        type: "paragraph",
        text: "Most frontend interviews measure the wrong things. They over-index on algorithm trivia and under-index on the judgment that actually separates a strong engineer from an average one: how they structure components, reason about state, handle edge cases, and make accessible, performant interfaces under realistic constraints.",
      },
      {
        type: "paragraph",
        text: "This guide lays out a framework you can reuse for every frontend role, then shows how to turn it into a scored assessment that predicts on-the-job performance.",
      },
      {
        type: "heading",
        text: "Start from the work, not the syllabus",
      },
      {
        type: "paragraph",
        text: "Before writing a single question, list the three to five things the person will actually do in their first 90 days. For most frontend roles that looks like building components from a spec, integrating an API, debugging a rendering issue, and making a UI accessible. Every question you write should trace back to one of those.",
      },
      {
        type: "callout",
        title: "Rule of thumb",
        text: "If you can't name the real task a question maps to, cut it. Trivia inflates difficulty without adding signal.",
      },
      {
        type: "heading",
        text: "The four layers worth testing",
      },
      {
        type: "bullets",
        items: [
          "Fundamentals — semantic HTML, CSS layout, and the language features they'll use daily.",
          "Framework fluency — component structure, state, and data flow in your actual stack.",
          "Production judgment — accessibility, performance, and error handling under realistic constraints.",
          "Communication — can they explain a trade-off and justify a decision in writing?",
        ],
      },
      {
        type: "paragraph",
        text: "Weight these by seniority. For a junior role, fundamentals and framework fluency carry most of the score. For a senior role, production judgment and communication should dominate — anyone can center a div by then.",
      },
      {
        type: "heading",
        text: "Prefer applied tasks over recall",
      },
      {
        type: "paragraph",
        text: "A short, applied task — 'here is a broken component, fix the re-render bug and explain what caused it' — tells you far more than a multiple-choice question about hook rules. Applied tasks are also harder to game with memorized answers and easier to score consistently against a rubric.",
      },
      {
        type: "quote",
        text: "The best predictor of whether someone can do the job is watching them do a small, realistic slice of the job.",
        cite: "A hiring principle worth tattooing on every scorecard",
      },
      {
        type: "heading",
        text: "Score against a rubric, not a gut feeling",
      },
      {
        type: "paragraph",
        text: "Define what a 1, 3, and 5 looks like for each dimension before candidates start. This is what makes results comparable across candidates and interviewers, and it's the single biggest lever for reducing bias in technical hiring.",
      },
      {
        type: "paragraph",
        text: "With Vertana, you can encode this framework directly: mix multiple-choice fundamentals with live coding tasks, let AI draft role-specific questions, and score every submission against the same rubric so rankings reflect ability rather than interviewer mood.",
      },
    ],
    related: [
      { label: "Test builder", href: "/features/test-builder" },
      { label: "For technical teams", href: "/use-cases/technical-teams" },
      { label: "AI question generation", href: "/features/ai-question-generation" },
    ],
  },
  {
    slug: "prevent-cheating-remote-technical-interviews",
    title: "How to prevent cheating in remote technical interviews",
    category: "Guides",
    intent: "how to stop cheating in online coding tests",
    excerpt:
      "Remote assessments open the door to shared answers and AI assistance. Here's how to design for integrity without treating every candidate like a suspect.",
    author: BLOG_AUTHOR,
    date: "2026-06-17",
    readMinutes: 7,
    blocks: [
      {
        type: "paragraph",
        text: "Remote hiring is here to stay, and with it comes a real question: how do you trust a score when you can't see the room? The answer isn't heavy-handed surveillance. It's a layered design that makes cheating hard, detectable, and mostly pointless.",
      },
      {
        type: "heading",
        text: "Design the assessment to resist gaming",
      },
      {
        type: "bullets",
        items: [
          "Use large question pools and randomize order so no two candidates see the same test.",
          "Favor applied tasks with many valid solutions over lookup-friendly trivia.",
          "Time-box sections so answers can't be crowdsourced mid-test.",
          "Ask candidates to explain their reasoning — copied answers rarely survive a 'why'.",
        ],
      },
      {
        type: "heading",
        text: "Add proctoring signals, with consent",
      },
      {
        type: "paragraph",
        text: "Lightweight integrity signals — camera verification at start, focus and tab-switch tracking during the test — catch the obvious cases without recording someone's living room for an hour. The key is disclosure: tell candidates exactly what's monitored and get explicit consent before they begin.",
      },
      {
        type: "callout",
        title: "Consent is non-negotiable",
        text: "Proctoring without clear, up-front consent erodes trust and can create legal exposure. Make it opt-in and transparent, and store the consent version with every attempt.",
      },
      {
        type: "heading",
        text: "Treat signals as flags, not verdicts",
      },
      {
        type: "paragraph",
        text: "A tab switch isn't proof of cheating — someone may have checked documentation, or a notification popped up. Use integrity signals to prioritize which submissions get a closer human look, never to auto-reject. This keeps the process fair and defensible.",
      },
      {
        type: "quote",
        text: "The goal isn't to catch people. It's to make the honest path the easy path.",
      },
      {
        type: "paragraph",
        text: "Vertana's proctoring is built exactly this way: consent-first camera verification, focus tracking, and randomized question pools — all surfaced as reviewable signals in your results, not silent auto-rejections.",
      },
    ],
    related: [
      { label: "Proctoring", href: "/features/proctoring" },
      { label: "For remote hiring", href: "/use-cases/remote-hiring" },
      { label: "GDPR compliance", href: "/legal/gdpr" },
    ],
  },
  {
    slug: "take-home-tests-vs-live-coding",
    title: "Take-home tests vs. live coding: which should you use?",
    category: "Comparisons",
    intent: "take home assignment vs live coding interview",
    excerpt:
      "Both formats have real trade-offs in signal, candidate experience, and cheating risk. Here's a clear framework for choosing — and how to get the best of both.",
    author: BLOG_AUTHOR,
    date: "2026-06-10",
    readMinutes: 6,
    blocks: [
      {
        type: "paragraph",
        text: "There's no universally 'right' assessment format — only the right format for a given role, stage, and candidate pool. The debate between take-home tests and live coding usually comes down to four factors.",
      },
      {
        type: "heading",
        text: "What take-home tests do well",
      },
      {
        type: "bullets",
        items: [
          "Show realistic work: candidates use their own tools and environment.",
          "Respect different working styles and reduce interview anxiety.",
          "Scale efficiently — no interviewer time required to administer.",
        ],
      },
      {
        type: "heading",
        text: "Where take-homes fall short",
      },
      {
        type: "bullets",
        items: [
          "Harder to verify authorship without integrity signals.",
          "Can burden candidates if the scope creeps beyond a couple of hours.",
          "Miss real-time reasoning and collaboration.",
        ],
      },
      {
        type: "heading",
        text: "What live coding does well",
      },
      {
        type: "bullets",
        items: [
          "Reveals thinking in real time — how they debug, ask questions, and handle hints.",
          "Hard to outsource, since you're watching the work happen.",
          "Great for assessing communication and collaboration.",
        ],
      },
      {
        type: "callout",
        title: "The pragmatic answer",
        text: "Use a short, scored screening assessment first to protect interviewer time, then a focused live session for finalists. You get scale and depth without over-testing anyone.",
      },
      {
        type: "quote",
        text: "Don't ask which format is better. Ask which format gives you the most signal per minute of everyone's time.",
      },
      {
        type: "paragraph",
        text: "Vertana supports both: build a scored screening test with multiple-choice and coding tasks, add integrity signals to trust the results, then invite top candidates to a deeper conversation with the context already in hand.",
      },
    ],
    related: [
      { label: "Test builder", href: "/features/test-builder" },
      { label: "Results and reporting", href: "/features/results-reporting" },
      { label: "For recruiters", href: "/use-cases/recruiters" },
    ],
  },
  {
    slug: "reduce-bias-structured-skills-assessments",
    title: "Reducing bias in hiring with structured skills assessments",
    category: "Hiring science",
    intent: "how to reduce bias in technical hiring",
    excerpt:
      "Unstructured interviews are among the weakest predictors of performance and among the easiest to bias. Structured, scored assessments are the fix.",
    author: BLOG_AUTHOR,
    date: "2026-06-03",
    readMinutes: 7,
    blocks: [
      {
        type: "paragraph",
        text: "Decades of research point to the same conclusion: unstructured interviews predict on-the-job performance poorly and are highly susceptible to bias. Structured, standardized assessments — where every candidate faces the same tasks scored against the same rubric — consistently do better on both fairness and accuracy.",
      },
      {
        type: "heading",
        text: "Why structure reduces bias",
      },
      {
        type: "paragraph",
        text: "When everyone answers the same questions and is scored on predefined criteria, there's far less room for gut-feel judgments and affinity bias to creep in. Structure turns 'I liked them' into 'they scored a 4 on production judgment for these specific reasons'.",
      },
      {
        type: "bullets",
        items: [
          "Standardize the questions so comparisons are apples-to-apples.",
          "Score against a rubric defined before candidates start.",
          "Anonymize submissions where possible during initial scoring.",
          "Separate skill evaluation from the culture conversation.",
        ],
      },
      {
        type: "callout",
        title: "Fairness is also a compliance issue",
        text: "Standardized, job-related assessments are easier to defend if a hiring decision is ever challenged. Document your rubric and keep consistent records.",
      },
      {
        type: "heading",
        text: "Structure doesn't mean rigid",
      },
      {
        type: "paragraph",
        text: "Structured assessment isn't about removing human judgment — it's about applying it consistently. You still read the code, weigh the trade-offs, and make the call. You just do it against the same bar for everyone.",
      },
      {
        type: "quote",
        text: "The fairest interview is the one where the process, not the interviewer's mood, decides the outcome.",
      },
      {
        type: "paragraph",
        text: "Vertana is built around structured evaluation: identical question sets, rubric-based scoring, and consistent reporting — so your rankings reflect ability, and your process holds up to scrutiny.",
      },
    ],
    related: [
      { label: "Results and reporting", href: "/features/results-reporting" },
      { label: "For recruiters", href: "/use-cases/recruiters" },
      { label: "GDPR compliance", href: "/legal/gdpr" },
    ],
  },
  {
    slug: "hiring-in-the-age-of-ai-cheating",
    title: "Hiring in the age of AI cheating: a practical playbook",
    category: "Guides",
    intent: "AI cheating in hiring assessments",
    excerpt:
      "Candidates can paste prompts into ChatGPT faster than you can schedule interviews. Here's how to design assessments that still produce defensible signal.",
    author: BLOG_AUTHOR,
    date: "2026-07-10",
    readMinutes: 9,
    featured: true,
    blocks: [
      {
        type: "paragraph",
        text: "Generative AI didn't invent cheating — but it lowered the friction to near zero. The response isn't to ban laptops or chase detection arms races alone. It's to design assessments where pasted answers fail: sandboxed execution, structured reasoning, and integrity signals you can explain to candidates up front.",
      },
      {
        type: "heading",
        text: "What still produces signal in 2026",
      },
      {
        type: "bullets",
        items: [
          "Coding questions with hidden test cases — output must run, not just read well.",
          "Scenario judgment with trade-offs — there is no single 'correct' paragraph.",
          "Timed, mixed-format tests — speed and prioritisation matter.",
          "Tab-focus integrity monitoring with explicit consent.",
        ],
      },
      {
        type: "callout",
        title: "Positioning wedge",
        text: "Vertana treats AI resistance as a product principle, not a footnote on individual questions.",
      },
      {
        type: "paragraph",
        text: "Tag questions by resistance level, mix formats deliberately, and show candidates exactly what integrity monitoring means before they start. Fair process is part of the signal.",
      },
    ],
    related: [
      { label: "Proctoring", href: "/features/proctoring" },
      { label: "React developer assessment", href: "/assessments/react-developer-assessment" },
      { label: "AI question generation", href: "/features/ai-question-generation" },
    ],
  },
  {
    slug: "ai-resistant-interview-questions",
    title: "What makes an interview question AI-resistant?",
    category: "Hiring science",
    intent: "AI-proof interview questions",
    excerpt:
      "Not every hard question resists AI. Learn the design patterns that force original reasoning instead of polished generic answers.",
    author: BLOG_AUTHOR,
    date: "2026-07-08",
    readMinutes: 7,
    blocks: [
      {
        type: "paragraph",
        text: "AI-resistant doesn't mean obscure. It means the question binds to context: a broken system, a ambiguous metric, a constrained timeline. Generic best-practice lists score well in ChatGPT and poorly in hiring.",
      },
      {
        type: "heading",
        text: "Patterns that work",
      },
      {
        type: "bullets",
        items: [
          "Broken-state debugging with specific symptoms.",
          "Prioritisation under constraints (time, scope, risk).",
          "Explain-your-trade-off prompts with no single answer key.",
          "Executable coding with multiple hidden edge cases.",
        ],
      },
      {
        type: "paragraph",
        text: "Vertana's library tags questions by AI resistance so recruiters can bias toward high-signal items without rewriting every screen from scratch.",
      },
    ],
    related: [
      { label: "Question library", href: "/library" },
      { label: "Backend engineer assessment", href: "/assessments/backend-engineer-assessment" },
      { label: "Test builder", href: "/features/test-builder" },
    ],
  },
  {
    slug: "structured-hiring-reduces-bias",
    title: "How structured hiring reduces bias without slowing you down",
    category: "Hiring science",
    intent: "structured hiring reduce bias",
    excerpt:
      "Structure isn't bureaucracy — it's how you make comparable decisions at speed.",
    author: BLOG_AUTHOR,
    date: "2026-06-18",
    readMinutes: 6,
    blocks: [
      {
        type: "paragraph",
        text: "Unstructured interviews optimise for confidence, not competence. A consistent question set, rubric, and integrity context lets you move fast without guessing.",
      },
    ],
    related: [
      { label: "For recruiters", href: "/use-cases/recruiters" },
      { label: "Results and reporting", href: "/features/results-reporting" },
    ],
  },
]

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function getFeaturedPost() {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0]
}

export function getRelatedPosts(slug: string, limit = 2) {
  const current = getBlogPost(slug)
  if (!current) return BLOG_POSTS.slice(0, limit)
  return BLOG_POSTS.filter(
    (p) => p.slug !== slug && p.category === current.category,
  )
    .concat(BLOG_POSTS.filter((p) => p.slug !== slug))
    .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
    .slice(0, limit)
}

export function formatBlogDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
