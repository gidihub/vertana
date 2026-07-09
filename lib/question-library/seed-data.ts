import type {
  AiResistance,
  LibraryCategory,
  QuestionType,
} from "@/lib/types"

export interface SeedLibraryQuestion {
  category: LibraryCategory
  type: QuestionType
  prompt: string
  options: string[]
  correct_option_index: number | null
  correct_answer_exact?: string | null
  ai_resistance: AiResistance
  estimated_minutes: number
  points?: number
}

export const LIBRARY_SEED: SeedLibraryQuestion[] = [
  // Frontend (12)
  {
    category: "frontend",
    type: "multiple_choice",
    prompt: "What does the React `useEffect` hook primarily handle?",
    options: [
      "Synchronous rendering only",
      "Side effects after render",
      "Global state management",
      "CSS-in-JS styling",
    ],
    correct_option_index: 1,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "frontend",
    type: "multiple_choice",
    prompt:
      "A list re-renders entirely when one item changes. Which pattern most often fixes unnecessary child updates?",
    options: [
      "Inline anonymous callbacks passed as props",
      "Memoizing list items with stable keys and props",
      "Moving state to URL query params",
      "Disabling Strict Mode",
    ],
    correct_option_index: 1,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "frontend",
    type: "short_answer",
    prompt:
      "Explain the difference between controlled and uncontrolled form inputs in React, and when you would choose each.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 5,
  },
  {
    category: "frontend",
    type: "coding",
    prompt:
      "Given a broken debounce hook that fires on every keystroke, find and fix the closure/stale state bug in the provided snippet (candidate is given the code inline).",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 12,
  },
  {
    category: "frontend",
    type: "multiple_choice",
    prompt: "Which metric is Core Web Vitals' LCP measuring?",
    options: [
      "Largest Contentful Paint",
      "Longest CPU Pause",
      "Layout Containment Property",
      "Largest CSS Payload",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "frontend",
    type: "short_answer",
    prompt:
      "How would you make a data table accessible for keyboard and screen-reader users?",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 6,
  },
  {
    category: "frontend",
    type: "multiple_choice",
    prompt: "In CSS, `display: contents` on a wrapper most affects:",
    options: [
      "The wrapper's children participate in the parent's layout as if the wrapper weren't there",
      "All children become position: fixed",
      "The wrapper creates a new stacking context only",
      "Font inheritance is disabled",
    ],
    correct_option_index: 0,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "frontend",
    type: "coding",
    prompt:
      "Implement a function `groupBy<T>(items: T[], key: keyof T): Record<string, T[]>` with correct typing in TypeScript.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 10,
  },
  {
    category: "frontend",
    type: "multiple_choice",
    prompt: "What is the main purpose of the `fetch` cache option `no-store` in Next.js App Router data fetching?",
    options: [
      "Skip HTTP cache and always fetch fresh data",
      "Store responses only in localStorage",
      "Disable JavaScript on the page",
      "Force static generation at build time",
    ],
    correct_option_index: 0,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "frontend",
    type: "short_answer",
    prompt:
      "Describe how you would investigate a layout shift (CLS) spike reported in production for a marketing homepage.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 7,
  },
  {
    category: "frontend",
    type: "multiple_choice",
    prompt: "Which statement about the event loop in browsers is correct?",
    options: [
      "Microtasks run before the next macrotask after the current stack clears",
      "All timers have the same priority as fetch callbacks",
      "requestAnimationFrame runs in the microtask queue",
      "Promises are macrotasks",
    ],
    correct_option_index: 0,
    ai_resistance: "medium",
    estimated_minutes: 4,
  },
  {
    category: "frontend",
    type: "coding",
    prompt:
      "Refactor the provided imperative DOM script into a small React component that preserves focus when the list reorders.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 15,
  },

  // Backend (12)
  {
    category: "backend",
    type: "multiple_choice",
    prompt: "What does HTTP status code 409 typically indicate?",
    options: [
      "Conflict with current resource state",
      "Gateway timeout",
      "Permanent redirect",
      "Payload too large only",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "backend",
    type: "short_answer",
    prompt:
      "Explain idempotency and why it matters for payment or webhook retry handlers.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 5,
  },
  {
    category: "backend",
    type: "coding",
    prompt:
      "Write a SQL query to find duplicate emails in an `users` table while excluding soft-deleted rows (`deleted_at is null`).",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 8,
  },
  {
    category: "backend",
    type: "multiple_choice",
    prompt: "In PostgreSQL, which isolation level prevents non-repeatable reads but allows phantom reads?",
    options: ["Read uncommitted", "Read committed", "Repeatable read", "Serializable"],
    correct_option_index: 2,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "backend",
    type: "coding",
    prompt:
      "Given a flaky integration test log (provided), identify the race condition in the order-creation service and propose a minimal fix.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 14,
  },
  {
    category: "backend",
    type: "multiple_choice",
    prompt: "What is the primary trade-off of using a message queue between services?",
    options: [
      "Decoupling and buffering at the cost of eventual consistency complexity",
      "Stronger synchronous coupling",
      "Eliminates need for schemas",
      "Guarantees exactly-once delivery without design",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "backend",
    type: "short_answer",
    prompt:
      "How would you design rate limiting for a public API used by both free and paid tiers?",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 8,
  },
  {
    category: "backend",
    type: "coding",
    prompt:
      "Implement an in-memory LRU cache with `get` and `put` in O(1) average time (language of candidate's choice).",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 15,
  },
  {
    category: "backend",
    type: "multiple_choice",
    prompt: "Which JWT claim is commonly used to identify the subject (user)?",
    options: ["sub", "aud", "iss", "nbf"],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "backend",
    type: "short_answer",
    prompt:
      "Describe blue/green deployment and one operational risk teams often underestimate.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 5,
  },
  {
    category: "backend",
    type: "multiple_choice",
    prompt: "What is the CAP theorem primarily about in distributed systems?",
    options: [
      "Trade-offs among consistency, availability, and partition tolerance",
      "CPU, API, and persistence layers",
      "Caching, auth, and profiling",
      "Concurrency, atomicity, and parallelism only",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "backend",
    type: "coding",
    prompt:
      "Debug the provided Express middleware chain where authenticated routes intermittently return 401 after token refresh.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 12,
  },

  // Data (12)
  {
    category: "data",
    type: "multiple_choice",
    prompt: "What does a left join return when there is no match on the right table?",
    options: [
      "Left rows with NULLs for right columns",
      "Only matching rows",
      "Only right rows",
      "An error",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "data",
    type: "short_answer",
    prompt:
      "Explain the difference between a fact table and a dimension table in a star schema.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 5,
  },
  {
    category: "data",
    type: "coding",
    prompt:
      "Write a window-function query to rank products by revenue within each category for the last 30 days.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 10,
  },
  {
    category: "data",
    type: "multiple_choice",
    prompt: "Which scenario best fits a Type II slowly changing dimension?",
    options: [
      "Track historical changes by adding new rows with version/effective dates",
      "Overwrite old values in place always",
      "Delete old records on change",
      "Store only current snapshot in cache",
    ],
    correct_option_index: 0,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "data",
    type: "short_answer",
    prompt:
      "Given a sudden 40% drop in conversion rate in analytics, list your first three investigative steps before changing product code.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 7,
  },
  {
    category: "data",
    type: "multiple_choice",
    prompt: "Precision vs recall: optimizing for fewer false positives emphasizes:",
    options: ["Precision", "Recall", "Both equally always", "Neither"],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "data",
    type: "coding",
    prompt:
      "Clean the provided messy CSV sample: parse dates, normalize currency, and flag rows with invalid region codes.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 12,
  },
  {
    category: "data",
    type: "multiple_choice",
    prompt: "What is data leakage in machine learning feature engineering?",
    options: [
      "Using future or target information unavailable at prediction time",
      "Training on too little data",
      "Using too many trees in a forest",
      "Encrypting features at rest",
    ],
    correct_option_index: 0,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "data",
    type: "short_answer",
    prompt:
      "When would you choose a cohort analysis over a simple daily active users chart?",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 5,
  },
  {
    category: "data",
    type: "coding",
    prompt:
      "Estimate confidence intervals for conversion rate A vs B from the provided experiment table without assuming normality.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 14,
  },
  {
    category: "data",
    type: "multiple_choice",
    prompt: "In dbt, what is the primary purpose of a staging model?",
    options: [
      "Lightweight cleaning/renaming close to raw sources",
      "Serving dashboards directly to BI tools only",
      "Managing Kubernetes pods",
      "Replacing the warehouse entirely",
    ],
    correct_option_index: 0,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "data",
    type: "short_answer",
    prompt:
      "Interpret the provided funnel chart where step 3 drops sharply on mobile only — what hypotheses would you test?",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 8,
  },

  // Ops / support (12)
  {
    category: "ops",
    type: "multiple_choice",
    prompt: "A customer cannot log in after a password reset. What is the best first step?",
    options: [
      "Verify identity, check account status, and review recent auth logs",
      "Immediately reset their password again without verification",
      "Disable MFA globally",
      "Close the ticket as user error",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "ops",
    type: "short_answer",
    prompt:
      "Write a concise, empathetic reply to a customer whose assessment link expired yesterday.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 5,
  },
  {
    category: "ops",
    type: "multiple_choice",
    prompt: "Severity 1 (production down) should typically trigger:",
    options: [
      "Immediate paging/on-call response with comms plan",
      "Next sprint backlog grooming",
      "Optional email in a week",
      "Social media post only",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "ops",
    type: "short_answer",
    prompt:
      "Given partial outage symptoms (API 503s in one region only), outline your triage checklist for the first 15 minutes.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 7,
  },
  {
    category: "ops",
    type: "multiple_choice",
    prompt: "What does MTTR measure in incident response?",
    options: [
      "Mean time to restore/recover service",
      "Maximum transactions per request",
      "Monthly ticket resolution quota",
      "Minimum test run time",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "ops",
    type: "coding",
    prompt:
      "Parse the provided nginx access log excerpt and identify the top 3 paths returning 5xx errors.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 10,
  },
  {
    category: "ops",
    type: "short_answer",
    prompt:
      "How do you balance security (least privilege) with speed when granting temporary production access?",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 6,
  },
  {
    category: "ops",
    type: "multiple_choice",
    prompt: "A runbook should primarily help responders to:",
    options: [
      "Execute known mitigation steps consistently under pressure",
      "Replace all engineering judgment",
      "Document office Wi-Fi passwords",
      "Avoid post-incident reviews",
    ],
    correct_option_index: 0,
    ai_resistance: "low",
    estimated_minutes: 2,
  },
  {
    category: "ops",
    type: "short_answer",
    prompt:
      "Role-play: a hiring manager insists a candidate's proctoring flag is 'definitely cheating.' How do you respond?",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 8,
  },
  {
    category: "ops",
    type: "multiple_choice",
    prompt: "Which change management practice reduces rollback risk most directly?",
    options: [
      "Canary or phased rollout with health checks",
      "Deploying only on Fridays",
      "Skipping staging for hotfixes",
      "Disabling monitoring during deploys",
    ],
    correct_option_index: 0,
    ai_resistance: "medium",
    estimated_minutes: 3,
  },
  {
    category: "ops",
    type: "coding",
    prompt:
      "Write a shell one-liner or short script to check disk usage on all mounted volumes and alert if any exceed 85%.",
    options: [],
    correct_option_index: null,
    ai_resistance: "medium",
    estimated_minutes: 8,
  },
  {
    category: "ops",
    type: "short_answer",
    prompt:
      "From the provided customer ticket thread, identify the root cause vs symptoms and propose next actions.",
    options: [],
    correct_option_index: null,
    ai_resistance: "high",
    estimated_minutes: 9,
  },
]

export const LIBRARY_CATEGORIES: { id: LibraryCategory; label: string }[] = [
  { id: "frontend", label: "Engineering · Frontend" },
  { id: "backend", label: "Engineering · Backend" },
  { id: "data", label: "Data & analytics" },
  { id: "ops", label: "Ops & support" },
]
