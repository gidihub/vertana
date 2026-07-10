import type { LibraryCategory, Question } from "@/lib/types"
import { sortLibraryQuestions } from "@/lib/question-library/display"

export type LibraryBundle = {
  id: string
  title: string
  category: LibraryCategory
  description: string
  questionCount: number
  estimatedMinutes: number
}

export const LIBRARY_BUNDLES: LibraryBundle[] = [
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
    id: "ml-senior-screen",
    title: "Senior ML engineer screen",
    category: "machine-learning",
    description:
      "Production LLMs, fine-tuning, RAG, deployment, and GCP — scenario-driven senior assessment.",
    questionCount: 30,
    estimatedMinutes: 120,
  },
  {
    id: "ml-llm-fundamentals",
    title: "LLM fundamentals & architecture",
    category: "machine-learning",
    description:
      "Transformers, context windows, embeddings, model selection, and production trade-offs.",
    questionCount: 15,
    estimatedMinutes: 55,
  },
  {
    id: "ml-finetune-prompt",
    title: "Fine-tuning & prompt engineering",
    category: "machine-learning",
    description: "LoRA/QLoRA, alignment, structured outputs, injection defense, and eval.",
    questionCount: 20,
    estimatedMinutes: 75,
  },
  {
    id: "ml-deploy-gcp",
    title: "ML deployment & Google Cloud",
    category: "machine-learning",
    description: "Docker, GPU serving, Vertex AI, Cloud Run, CI/CD, and cost optimization.",
    questionCount: 20,
    estimatedMinutes: 80,
  },
  {
    id: "ml-quick-screen",
    title: "ML engineer quick screen",
    category: "machine-learning",
    description: "High-signal scenario questions for a 45-minute ML technical screen.",
    questionCount: 10,
    estimatedMinutes: 45,
  },
  {
    id: "mbb-associate-screen",
    title: "MBB associate full screen",
    category: "project-program-associate",
    description:
      "Structured problem-solving, sizing, quant, Excel, decks, and business judgment.",
    questionCount: 30,
    estimatedMinutes: 90,
  },
  {
    id: "mbb-problem-solving",
    title: "Problem solving & market sizing",
    category: "project-program-associate",
    description: "Issue trees, MECE, hypotheses, and estimation under pressure.",
    questionCount: 20,
    estimatedMinutes: 55,
  },
  {
    id: "mbb-quant-excel",
    title: "Quantitative & Excel analysis",
    category: "project-program-associate",
    description: "Mental math, chart reading, spreadsheet logic, and data interpretation.",
    questionCount: 25,
    estimatedMinutes: 60,
  },
  {
    id: "mbb-communication",
    title: "Communication & judgment",
    category: "project-program-associate",
    description: "Deck craft, written synthesis, and client-facing business judgment.",
    questionCount: 20,
    estimatedMinutes: 50,
  },
  {
    id: "mbb-quick-screen",
    title: "Associate quick screen",
    category: "project-program-associate",
    description: "10 high-signal questions for a 30-minute associate technical screen.",
    questionCount: 10,
    estimatedMinutes: 30,
  },
]

export function questionsForBundle(
  bundle: LibraryBundle,
  pool: Question[],
): Question[] {
  const inCategory = pool.filter(
    (q) =>
      (q.category_id ?? q.library_category) === bundle.category,
  )
  return sortLibraryQuestions(inCategory, "recommended").slice(
    0,
    bundle.questionCount,
  )
}
