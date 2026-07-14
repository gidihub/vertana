/** Public SEO landing pages for recruiter-intent skill assessments. */

export interface AssessmentLanding {
  slug: string
  title: string
  metaDescription: string
  eyebrow: string
  lead: string
  whatItTests: string[]
  sampleQuestion: string
  aiResistance: string
  libraryCategoryId: string
}

export const ASSESSMENT_LANDINGS: AssessmentLanding[] = [
  {
    slug: "react-developer-assessment",
    title: "React developer assessment for hiring",
    metaDescription:
      "Screen React developers with timed, AI-resistant questions — hooks, state, rendering, and component design.",
    eyebrow: "Frontend · React",
    lead: "Evaluate React fluency with questions that test real component thinking, not memorized trivia.",
    whatItTests: ["Hooks and concurrent rendering", "State management patterns", "Component API design", "Performance basics"],
    sampleQuestion:
      "Which React hook lets you safely subscribe to an external store without tearing during concurrent rendering?",
    aiResistance:
      "Questions mix scenario judgment with code reasoning. Coding items run in a sandboxed IDE, so pasted AI output still has to pass test cases.",
    libraryCategoryId: "frontend-engineering",
  },
  {
    slug: "backend-engineer-assessment",
    title: "Backend engineer assessment for hiring",
    metaDescription:
      "Screen backend engineers on APIs, data modeling, concurrency, and system design fundamentals.",
    eyebrow: "Engineering · Backend",
    lead: "Test how candidates design APIs, reason about data, and handle failure — not just syntax.",
    whatItTests: ["REST and API design", "SQL and data modeling", "Concurrency and reliability", "Auth and security basics"],
    sampleQuestion:
      "How would you design rate limiting for a public API without adding noticeable latency to successful requests?",
    aiResistance:
      "Open-ended system prompts require structured trade-off reasoning. Coding questions execute against hidden test cases.",
    libraryCategoryId: "backend-engineering",
  },
  {
    slug: "data-analyst-assessment",
    title: "Data analyst pre-employment test",
    metaDescription:
      "Hire data analysts with SQL, Excel logic, and interpretation questions recruiters can defend.",
    eyebrow: "Data · Analyst",
    lead: "Separate analysts who can query, interpret, and communicate findings from those who only list tools on a résumé.",
    whatItTests: ["SQL joins and aggregations", "Metric definition", "Data interpretation", "Stakeholder communication"],
    sampleQuestion:
      "A dashboard shows conversion up 12% but revenue flat. What are three hypotheses you would investigate first?",
    aiResistance:
      "Interpretation questions ask for prioritised reasoning on ambiguous data — harder to paste from a generic AI answer.",
    libraryCategoryId: "data-analyst",
  },
  {
    slug: "machine-learning-engineer-assessment",
    title: "Machine learning engineer hiring test",
    metaDescription:
      "Evaluate ML engineers on training workflows, evaluation, deployment, and responsible AI judgment.",
    eyebrow: "AI · Machine Learning",
    lead: "Assess whether candidates can ship models responsibly — not just quote sklearn imports.",
    whatItTests: ["Train/validation design", "Feature leakage", "Model evaluation", "Deployment trade-offs"],
    sampleQuestion:
      "Your offline AUC is 0.94 but production precision collapses after launch. What checks do you run first?",
    aiResistance:
      "Scenario questions target failure modes and production judgment rather than textbook definitions.",
    libraryCategoryId: "machine-learning",
  },
  {
    slug: "llm-engineering-assessment",
    title: "LLM engineering assessment for hiring",
    metaDescription:
      "Screen LLM engineers on prompting, retrieval, evaluation, and safe deployment patterns.",
    eyebrow: "AI · LLM Engineering",
    lead: "Test how candidates design reliable LLM features — retrieval, evals, guardrails, and cost control.",
    whatItTests: ["Prompt and tool design", "RAG architecture", "Offline evaluation", "Safety and monitoring"],
    sampleQuestion:
      "How would you detect and reduce hallucinations in a customer-support RAG assistant without blocking valid answers?",
    aiResistance:
      "Work-sample style prompts require system design choices grounded in failure modes, not generic best-practice lists.",
    libraryCategoryId: "machine-learning",
  },
  {
    slug: "project-associate-assessment",
    title: "Project / program associate assessment",
    metaDescription:
      "MBB-style structured problem solving, Excel logic, and communication for associate hiring.",
    eyebrow: "Business · Associate",
    lead: "Measure structured thinking, quantitative fluency, and clear communication under time pressure.",
    whatItTests: ["Structured problem solving", "Quantitative reasoning", "Excel-style logic", "Executive communication"],
    sampleQuestion:
      "A retailer’s margin fell 2 points while revenue grew 8%. Outline a hypothesis tree to diagnose the drivers.",
    aiResistance:
      "Case prompts require candidate-specific structure and prioritisation — not a single correct paragraph.",
    libraryCategoryId: "project-program-associate",
  },
  {
    slug: "devops-engineer-assessment",
    title: "DevOps engineer assessment for hiring",
    metaDescription:
      "Screen DevOps candidates on CI/CD, containers, cloud primitives, and incident response.",
    eyebrow: "Engineering · DevOps",
    lead: "Validate operational judgment across deploy pipelines, observability, and failure recovery.",
    whatItTests: ["CI/CD design", "Containers and orchestration", "Cloud networking", "Incident response"],
    sampleQuestion:
      "A deployment succeeds but 30% of pods crash-loop after a config change. What is your first 15-minute playbook?",
    aiResistance:
      "Incident scenarios test sequencing and risk judgment under ambiguity.",
    libraryCategoryId: "devops-cloud",
  },
  {
    slug: "qa-engineer-assessment",
    title: "QA engineer pre-employment test",
    metaDescription:
      "Hire QA engineers with test design, automation strategy, and risk-based prioritisation questions.",
    eyebrow: "Engineering · QA",
    lead: "Find testers who design coverage strategically — not just execute scripted cases.",
    whatItTests: ["Test planning", "Automation trade-offs", "Regression strategy", "Bug triage communication"],
    sampleQuestion:
      "You have two days before release and 40 open bugs. How do you prioritise verification work?",
    aiResistance:
      "Prioritisation prompts require context-specific reasoning tied to risk and scope.",
    libraryCategoryId: "qa-testing",
  },
  {
    slug: "ai-assisted-work-sample",
    title: "AI-assisted work sample assessment",
    metaDescription:
      "Evaluate how candidates direct AI tools to complete real work — a 2026 hireable skill.",
    eyebrow: "AI Fluency · Work sample",
    lead: "Measure AI fluency as a skill: can the candidate scope, verify, and ship with an assistant?",
    whatItTests: ["Task decomposition", "Verification discipline", "Prompt iteration", "Quality control"],
    sampleQuestion:
      "Using an AI assistant, draft a migration plan for a monolith API — what do you verify before sharing it?",
    aiResistance:
      "This is an AI-native task graded on process and verification, not on banning AI.",
    libraryCategoryId: "ai-assisted-work-sample",
  },
  {
    slug: "ai-governance-assessment",
    title: "AI governance and responsible AI assessment",
    metaDescription:
      "Scenario-based questions on privacy, bias, and appropriate AI use in business contexts.",
    eyebrow: "AI Fluency · Governance",
    lead: "Test judgment on responsible AI deployment — not policy memorisation.",
    whatItTests: ["Data privacy", "Bias and fairness", "Human oversight", "Vendor risk"],
    sampleQuestion:
      "A team wants to feed customer support chats into an external LLM API. What risks do you flag first?",
    aiResistance:
      "Governance scenarios require stakeholder-specific risk framing.",
    libraryCategoryId: "ai-governance",
  },
  {
    slug: "javascript-typescript-assessment",
    title: "JavaScript and TypeScript hiring assessment",
    metaDescription:
      "Screen JS/TS developers on types, async patterns, and production debugging.",
    eyebrow: "Frontend · JavaScript",
    lead: "Test everyday JavaScript and TypeScript judgment — not leetcode trivia.",
    whatItTests: ["Type narrowing", "Async control flow", "Module boundaries", "Runtime debugging"],
    sampleQuestion:
      "An API returns union types that confuse your UI states. How do you model loading, empty, error, and success safely in TypeScript?",
    aiResistance:
      "Applied debugging prompts require reasoning about a specific broken scenario.",
    libraryCategoryId: "frontend-engineering",
  },
  {
    slug: "python-data-science-assessment",
    title: "Python for data science hiring test",
    metaDescription:
      "Evaluate pandas-style thinking, feature hygiene, and model evaluation discipline.",
    eyebrow: "Data · Python",
    lead: "Separate practitioners who can ship notebooks into production from tool tourists.",
    whatItTests: ["Data cleaning", "Leakage awareness", "Metric selection", "Communication"],
    sampleQuestion:
      "Your train score is excellent but validation F1 drops after a new feature. What leakage checks do you run?",
    aiResistance:
      "Diagnostics questions target sequencing of checks, not library syntax recall.",
    libraryCategoryId: "data-analyst",
  },
  {
    slug: "excel-skills-pre-employment-test",
    title: "Excel skills pre-employment test",
    metaDescription:
      "Hire analysts and operators who can model, sanity-check, and explain spreadsheet logic.",
    eyebrow: "Business · Excel",
    lead: "Measure spreadsheet fluency as structured thinking under time pressure.",
    whatItTests: ["Lookup logic", "Scenario modeling", "Error checking", "Metric definition"],
    sampleQuestion:
      "A forecast doubles revenue but margins collapse. Which three formula or reference errors do you inspect first?",
    aiResistance:
      "Tied to a concrete broken workbook narrative rather than generic Excel definitions.",
    libraryCategoryId: "business-financial-analysis",
  },
  {
    slug: "ux-design-assessment",
    title: "UX designer assessment for hiring",
    metaDescription:
      "Evaluate UX candidates on research synthesis, interaction design, and accessibility judgment.",
    eyebrow: "Design · UX",
    lead: "Test how designers frame problems, justify decisions, and ship accessible interfaces.",
    whatItTests: ["Problem framing", "Interaction flows", "Accessibility", "Critique and iteration"],
    sampleQuestion:
      "Users abandon a multi-step form at step three. How do you diagnose whether it's copy, layout, or validation?",
    aiResistance:
      "Scenario critique requires prioritised hypotheses, not generic design platitudes.",
    libraryCategoryId: "ux-design",
  },
  {
    slug: "sales-assessment-test",
    title: "Sales and growth marketing assessment",
    metaDescription:
      "Screen commercial hires on pipeline judgment, messaging, and experiment design.",
    eyebrow: "Business · Sales",
    lead: "Find reps and growth operators who can qualify, message, and iterate with data.",
    whatItTests: ["Qualification", "Objection handling", "Experiment design", "Metric literacy"],
    sampleQuestion:
      "Reply rate dropped after a positioning change. What would you test before rewriting the entire sequence?",
    aiResistance:
      "Prioritised experiment plans resist copy-paste generic playbooks.",
    libraryCategoryId: "sales-growth-marketing",
  },
  {
    slug: "remote-collaboration-assessment",
    title: "Remote collaboration assessment",
    metaDescription:
      "Test async communication, handoffs, and remote teamwork judgment.",
    eyebrow: "Ways of Working · Remote",
    lead: "Hire people who communicate clearly across time zones and written channels.",
    whatItTests: ["Async updates", "Handoff clarity", "Conflict de-escalation", "Documentation"],
    sampleQuestion:
      "A teammate missed a deadline that blocks your work. What do you write in the public channel vs. a direct message?",
    aiResistance:
      "Communication prompts are situational and reveal tone, structure, and judgment.",
    libraryCategoryId: "remote-collaboration",
  },
]

export function getAssessmentLanding(slug: string): AssessmentLanding | undefined {
  return ASSESSMENT_LANDINGS.find((page) => page.slug === slug)
}
