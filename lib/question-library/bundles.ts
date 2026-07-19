import type { LibraryCategory, Question, QuestionSeniority } from "@/lib/types"
import { selectQuestionsForBundle } from "@/lib/question-library/select-bundle-questions"

export type LibraryBundle = {
  id: string
  title: string
  /** Primary category for library nav / filter when a bundle is used. */
  category: LibraryCategory
  /** When set, questions are drawn from all listed leaf categories (even split). */
  categories?: LibraryCategory[]
  description: string
  questionCount: number
  estimatedMinutes: number
  /** When set, prefer questions tagged at this seniority level. */
  seniority?: QuestionSeniority | null
}

export const LIBRARY_BUNDLES: LibraryBundle[] = [
  {
    id: "ai-work-sample-quick",
    title: "AI-assisted work sample quick screen",
    category: "ai-assisted-work-sample",
    description:
      "Candidates may use AI; score how they direct, verify, and correct tool output.",
    questionCount: 8,
    estimatedMinutes: 40,
    seniority: "mid",
  },
  {
    id: "backend-screen",
    title: "Backend screening",
    category: "backend-engineering",
    description: "APIs, SQL, concurrency, and system design basics.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "frontend-fundamentals",
    title: "Frontend fundamentals",
    category: "frontend-engineering",
    description: "React, performance, accessibility, and UI debugging.",
    questionCount: 10,
    estimatedMinutes: 40,
  },
  {
    id: "data-quick",
    title: "Data analyst quick screen",
    category: "data-analyst",
    description: "SQL, statistics, and practical data reasoning.",
    questionCount: 6,
    estimatedMinutes: 25,
  },
  {
    id: "ops-support",
    title: "Ops & support screen",
    category: "customer-technical-support",
    description: "Incident response, monitoring, and customer-facing triage.",
    questionCount: 6,
    estimatedMinutes: 28,
  },
  {
    id: "devops-quick",
    title: "DevOps quick screen",
    category: "devops-cloud",
    description: "Containers, CI/CD, IaC, and production troubleshooting.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "devops-full",
    title: "DevOps full screen",
    category: "devops-cloud",
    description: "Broader cloud-native ops coverage across topics in the bank.",
    questionCount: 18,
    estimatedMinutes: 65,
  },
  {
    id: "qa-quick",
    title: "QA quick screen",
    category: "qa-testing",
    description: "Test strategy, automation, and flaky-test diagnosis.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "qa-full",
    title: "QA full screen",
    category: "qa-testing",
    description: "End-to-end quality engineering across the QA bank.",
    questionCount: 18,
    estimatedMinutes: 65,
  },
  {
    id: "finance-quick",
    title: "Business & financial quick screen",
    category: "business-financial-analysis",
    description: "Unit economics, forecasting, and financial reasoning.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "finance-full",
    title: "Business & financial full screen",
    category: "business-financial-analysis",
    description: "Deeper financial modeling and analysis scenarios.",
    questionCount: 18,
    estimatedMinutes: 60,
  },
  {
    id: "sales-quick",
    title: "Sales & growth quick screen",
    category: "sales-growth-marketing",
    description: "Prospecting, pipeline, and growth marketing judgment.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "sales-full",
    title: "Sales & growth full screen",
    category: "sales-growth-marketing",
    description: "Full-funnel sales and growth scenarios from the bank.",
    questionCount: 18,
    estimatedMinutes: 60,
  },
  {
    id: "ai-governance-quick",
    title: "AI governance quick screen",
    category: "ai-governance",
    description: "Responsible AI use, compliance, and risk judgment.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "mobile-quick",
    title: "Mobile engineering quick screen",
    category: "mobile-engineering",
    description: "iOS, Android, React Native, and offline/sync scenarios.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "dba-quick",
    title: "Database admin quick screen",
    category: "database-administration",
    description: "Query tuning, replication, and operational database work.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "ux-quick",
    title: "UX & design quick screen",
    category: "ux-design",
    description: "Usability, IA, accessibility, and product design judgment.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "hr-quick",
    title: "HR & people quick screen",
    category: "hr-people-management",
    description: "Hiring, feedback, and people-management scenarios.",
    questionCount: 8,
    estimatedMinutes: 35,
  },
  {
    id: "remote-quick",
    title: "Remote collaboration quick screen",
    category: "remote-collaboration",
    description: "Async communication, documentation, and distributed teamwork.",
    questionCount: 8,
    estimatedMinutes: 30,
  },
  {
    id: "ml-senior-screen",
    title: "Senior ML engineer screen",
    category: "machine-learning",
    description:
      "Production LLMs, fine-tuning, RAG, deployment, and GCP — scenario-driven senior assessment.",
    questionCount: 30,
    estimatedMinutes: 120,
    seniority: "senior",
  },
  {
    id: "ml-llm-fundamentals",
    title: "LLM fundamentals & architecture",
    category: "machine-learning",
    description:
      "Transformers, context windows, embeddings, model selection, and production trade-offs.",
    questionCount: 15,
    estimatedMinutes: 55,
    seniority: "mid",
  },
  {
    id: "ml-finetune-prompt",
    title: "Fine-tuning & prompt engineering",
    category: "machine-learning",
    description: "LoRA/QLoRA, alignment, structured outputs, injection defense, and eval.",
    questionCount: 20,
    estimatedMinutes: 75,
    seniority: "mid",
  },
  {
    id: "ml-deploy-gcp",
    title: "ML deployment & Google Cloud",
    category: "machine-learning",
    description: "Docker, GPU serving, Vertex AI, Cloud Run, CI/CD, and cost optimization.",
    questionCount: 20,
    estimatedMinutes: 80,
    seniority: "mid",
  },
  {
    id: "ml-quick-screen",
    title: "ML engineer quick screen",
    category: "machine-learning",
    description: "High-signal scenario questions for a 45-minute ML technical screen.",
    questionCount: 10,
    estimatedMinutes: 45,
    seniority: "mid",
  },
  {
    id: "mbb-associate-screen",
    title: "MBB associate full screen",
    category: "project-program-associate",
    description:
      "Structured problem-solving, sizing, quant, Excel, decks, and business judgment.",
    questionCount: 30,
    estimatedMinutes: 90,
    seniority: "mid",
  },
  {
    id: "mbb-problem-solving",
    title: "Problem solving & market sizing",
    category: "project-program-associate",
    description: "Issue trees, MECE, hypotheses, and estimation under pressure.",
    questionCount: 20,
    estimatedMinutes: 55,
    seniority: "mid",
  },
  {
    id: "mbb-quant-excel",
    title: "Quantitative & Excel analysis",
    category: "project-program-associate",
    description: "Mental math, chart reading, spreadsheet logic, and data interpretation.",
    questionCount: 25,
    estimatedMinutes: 60,
    seniority: "mid",
  },
  {
    id: "mbb-communication",
    title: "Communication & judgment",
    category: "project-program-associate",
    description: "Deck craft, written synthesis, and client-facing business judgment.",
    questionCount: 20,
    estimatedMinutes: 50,
    seniority: "senior",
  },
  {
    id: "mbb-quick-screen",
    title: "Associate quick screen",
    category: "project-program-associate",
    description: "10 high-signal questions for a 30-minute associate technical screen.",
    questionCount: 10,
    estimatedMinutes: 30,
    seniority: "mid",
  },
  // ── Applied Aptitude ──
  {
    id: "reading-comprehension-quick",
    title: "Reading comprehension quick screen",
    category: "reading-comprehension",
    description:
      "Work-document reading accuracy — policies, emails, and specs. Not a psychometric test.",
    questionCount: 10,
    estimatedMinutes: 15,
    seniority: "junior",
  },
  {
    id: "attention-to-detail-quick",
    title: "Attention to detail quick screen",
    category: "attention-to-detail",
    description: "Find mismatches in invoices, tables, and forms.",
    questionCount: 10,
    estimatedMinutes: 15,
    seniority: "junior",
  },
  {
    id: "following-instructions-quick",
    title: "Following instructions quick screen",
    category: "following-instructions",
    description: "Execute multi-step procedures with constraints and exceptions.",
    questionCount: 10,
    estimatedMinutes: 15,
    seniority: "junior",
  },
  {
    id: "applied-numeracy-quick",
    title: "Applied numeracy quick screen",
    category: "applied-numeracy",
    description: "Everyday arithmetic from receipts, timesheets, and budgets (USD).",
    questionCount: 10,
    estimatedMinutes: 15,
    seniority: "junior",
  },
  {
    id: "numerical-reasoning-quick",
    title: "Numerical reasoning quick screen",
    category: "numerical-reasoning",
    description: "Interpret charts, KPI tables, and variance summaries.",
    questionCount: 10,
    estimatedMinutes: 15,
    seniority: "junior",
  },
  {
    id: "critical-thinking-quick",
    title: "Critical thinking quick screen",
    category: "critical-thinking",
    description: "Evaluate claims and evidence in business memos and analyses.",
    questionCount: 10,
    estimatedMinutes: 15,
    seniority: "mid",
  },
  {
    id: "problem-solving-quick",
    title: "Problem solving quick screen",
    category: "problem-solving",
    description: "Structure approaches to ambiguous scenarios with incomplete information.",
    questionCount: 10,
    estimatedMinutes: 15,
    seniority: "mid",
  },
  {
    id: "general-screening-core",
    title: "General screening — core",
    category: "applied-aptitude",
    categories: [
      "reading-comprehension",
      "attention-to-detail",
      "applied-numeracy",
      "following-instructions",
    ],
    description:
      "High-volume entry screen: reading, detail, numeracy, and instruction-following. Use with role-specific assessment — not as a sole cutoff.",
    questionCount: 12,
    estimatedMinutes: 20,
    seniority: "junior",
  },
  {
    id: "analytical-screening",
    title: "Analytical screening",
    category: "applied-aptitude",
    categories: [
      "numerical-reasoning",
      "critical-thinking",
      "problem-solving",
    ],
    description:
      "Quantitative interpretation plus judgment on memos and ambiguous scenarios.",
    questionCount: 15,
    estimatedMinutes: 25,
    seniority: "mid",
  },
]

export function questionsForBundle(
  bundle: LibraryBundle,
  pool: Question[],
): Question[] {
  return selectQuestionsForBundle(bundle, pool)
}

/** Bundle count per leaf category id. */
export function bundleCountByCategory(): Record<string, number> {
  const map: Record<string, number> = {}
  for (const b of LIBRARY_BUNDLES) {
    const ids = b.categories ?? [b.category]
    for (const id of ids) {
      map[id] = (map[id] ?? 0) + 1
    }
  }
  return map
}

/** Bundles visible when a parent or leaf category is selected. */
export function bundlesForCategory(categoryId: string): LibraryBundle[] {
  if (!categoryId) return LIBRARY_BUNDLES
  return LIBRARY_BUNDLES.filter((b) => {
    if (b.category === categoryId) return true
    if (b.categories?.includes(categoryId as LibraryCategory)) return true
    const parent = categoryId
    // Parent filter: show bundles anchored to this parent id.
    if (b.category === parent && b.categories?.length) return true
    return false
  })
}
