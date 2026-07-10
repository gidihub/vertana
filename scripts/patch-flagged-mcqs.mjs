/**
 * Patch the 9 flagged MCQs in Supabase (prompt, options, correct_answer).
 */
import { createClient } from "@supabase/supabase-js"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { loadEnv } from "./library-seed-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const PATCHES = [
  {
    match: "In PostgreSQL, which isolation level prevents non-repeatable reads",
    prompt:
      "In PostgreSQL, which isolation level prevents non-repeatable reads?",
    options: [
      "Read uncommitted",
      "Read committed",
      "Repeatable read",
      "Serializable",
    ],
    correct_option_index: 2,
  },
  {
    match: "When designing a FIFO queue that must support millions",
    prompt:
      "When designing a distributed queue where messages sharing the same partition key must be consumed in strict send order at massive scale, which capability is most critical?",
    options: [
      "Per-partition FIFO ordering guarantees",
      "At-least-once delivery without ordering",
      "High availability with best-effort delivery only",
      "Offline batch processing support",
    ],
    correct_option_index: 0,
  },
  {
    match: "You want to distribute work across multiple instances of a backend service processing a queue of tasks which must only be processed once",
    prompt:
      "You distribute tasks across multiple backend instances via a message queue. Duplicates must be handled with idempotent workers. Which delivery guarantee should you design for?",
    options: [
      "Exactly-once delivery from the broker alone",
      "At-least-once delivery with idempotent consumers",
      "Best-effort delivery",
      "None; duplicates are acceptable",
    ],
    correct_option_index: 1,
  },
  {
    match: "You want to implement API rate limiting per user with minimal data storage",
    prompt:
      "You need per-user API rate limiting in a horizontally scaled service backed by Redis. Which algorithm stores only a token count and last-refill timestamp per user while allowing controlled bursts?",
    options: [
      "Fixed-window counters with in-memory hash maps",
      "Sliding log of every request timestamp in PostgreSQL",
      "Token bucket implemented in Redis",
      "Leaky bucket with state stored in client cookies",
    ],
    correct_option_index: 2,
  },
  {
    match: "Your backend service implements per-user API rate limiting using a Redis data store",
    prompt:
      "Your backend implements per-user API rate limiting in Redis using fixed one-minute windows. Which Redis pattern gives an exact per-user count with minimal memory via key expiration?",
    options: [
      "Redis Sorted Set storing every request timestamp",
      "Redis HyperLogLog per user",
      "Redis Bloom filter per user",
      "Redis INCR on a per-user window key with EXPIRE",
    ],
    correct_option_index: 3,
  },
  {
    match: "You apply a Terraform configuration that modifies a security group to allow HTTP access",
    prompt:
      "You apply a Terraform change that updates a security group ingress rule for HTTP, and all web traffic stops immediately. What is the most probable root cause?",
    options: [
      "Terraform replaced the security group resource, detaching it from running instances",
      "You applied changes without running terraform plan first",
      "The new ingress rule uses an overly restrictive or incorrect CIDR block",
      "Misconfigured AWS IAM permissions on the Terraform role",
    ],
    correct_option_index: 2,
  },
  {
    match: "During a Kubernetes rolling update, pods are not terminating",
    prompt:
      "During a Kubernetes rolling update, new pods stay Pending while older pods keep running. What should you inspect first?",
    options: [
      "Describe a Pending pod and read Events for scheduling failures (CPU/memory, quotas, affinity)",
      "Pod Disruption Budgets on the Deployment",
      "Horizontal Pod Autoscaler targets",
      "NetworkPolicy egress rules",
    ],
    correct_option_index: 0,
  },
  {
    match: "Which state management approach is most suitable for a React app requiring complex async logic",
    prompt:
      "Which state management approach is most suitable for a React app with complex async data fetching, server-state caching, and UI state synchronization?",
    options: [
      "TanStack Query for server state plus a small client store (e.g. Zustand) for UI state",
      "React Context with useReducer and custom middleware only",
      "useState hooks in each component only",
      "Global variables mutated outside React",
    ],
    correct_option_index: 0,
  },
  {
    match: "[Quantitative reasoning] Revenue is $10M, and the company wants to grow 20%",
    prompt:
      "[Quantitative reasoning] Revenue is $10M. Next year revenue grows 20% and profit margin stays flat at 18% of revenue. What is next year's expected profit?",
    options: ["$1.8M", "$2.0M", "$2.16M", "$2.4M"],
    correct_option_index: 2,
  },
]

async function main() {
  loadEnv(join(root, ".env.local"))
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing Supabase credentials")
    process.exit(1)
  }

  const supabase = createClient(url, key)
  let updated = 0

  for (const patch of PATCHES) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, prompt")
      .eq("is_library_item", true)
      .ilike("prompt", `${patch.match}%`)

    if (error) throw new Error(error.message)
    if (!data?.length) {
      console.warn(`No match: ${patch.match.slice(0, 50)}…`)
      continue
    }
    if (data.length > 1) {
      console.warn(`Multiple matches (${data.length}) for: ${patch.match.slice(0, 50)}…`)
      continue
    }

    for (const row of data) {
      const { error: upErr } = await supabase
        .from("questions")
        .update({
          prompt: patch.prompt,
          options: patch.options,
          correct_answer: { kind: "index", value: patch.correct_option_index },
        })
        .eq("id", row.id)

      if (upErr) throw new Error(upErr.message)
      updated++
      console.log(`Patched: ${patch.prompt.slice(0, 70)}…`)
    }
  }

  console.log(`\nDone — ${updated} row(s) updated in Supabase`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
