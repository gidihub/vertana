#!/usr/bin/env node
/**
 * Generate Applied Aptitude question banks (7 leaf categories × 30 = 210 items).
 *
 * Usage: node scripts/generate-applied-aptitude.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, "../lib/question-library/generated")

/** Evenly spread short-answer slots across 30 items (0-based). */
const SHORT_ANSWER_INDICES = new Set([2, 6, 10, 14, 18, 22, 26])

/** Medium slots that are artifact-heavy → high ai_resistance (8 hard + 4 medium = 12 min). */
const HIGH_MEDIUM_INDICES = new Set([11, 13, 15, 17])

const CATEGORIES = [
  "reading-comprehension",
  "attention-to-detail",
  "following-instructions",
  "applied-numeracy",
  "numerical-reasoning",
  "critical-thinking",
  "problem-solving",
]

function difficultyForIndex(i) {
  if (i < 10) return "easy"
  if (i < 22) return "medium"
  return "hard"
}

function typeForIndex(i) {
  return SHORT_ANSWER_INDICES.has(i) ? "short_answer" : "multiple_choice"
}

function aiResistanceForIndex(i, override) {
  if (override) return override
  if (i >= 22) return "high"
  if (HIGH_MEDIUM_INDICES.has(i)) return "high"
  if (i < 10) return "medium"
  return "medium"
}

function seniorityFor(categoryId, difficulty) {
  if (
    difficulty === "hard" &&
    (categoryId === "critical-thinking" || categoryId === "problem-solving")
  ) {
    return "senior"
  }
  if (difficulty === "medium" || difficulty === "hard") return "mid"
  return "junior"
}

function minutesFor(difficulty, type) {
  if (type === "short_answer") return 2
  return difficulty === "hard" ? 2 : 1
}

function buildQuestion(categoryId, index, spec) {
  const difficulty = difficultyForIndex(index)
  const type = typeForIndex(index)
  const ai_resistance = aiResistanceForIndex(index, spec.resistance)
  const estimated_minutes = minutesFor(difficulty, type)
  const seniority = spec.seniority ?? seniorityFor(categoryId, difficulty)

  const base = {
    category: categoryId,
    category_id: categoryId,
    type,
    prompt: `${spec.tag}\n\n${spec.artifact}\n\n${spec.question}`,
    test_cases: [],
    ai_resistance,
    estimated_minutes,
    difficulty,
    points: 1,
    seniority,
  }

  if (type === "multiple_choice") {
    return {
      ...base,
      options: spec.options,
      correct_option_index: spec.correct,
      correct_answer_exact: null,
    }
  }

  return {
    ...base,
    options: [],
    correct_option_index: null,
    correct_answer_exact: spec.exact ?? null,
    rubric: spec.rubric,
  }
}

function assembleCategory(categoryId, specs) {
  if (specs.length !== 30) {
    throw new Error(`${categoryId}: expected 30 specs, got ${specs.length}`)
  }
  const ordered = normalizeSpecs(specs, categoryId)
  return ordered.map((spec, i) => buildQuestion(categoryId, i, spec))
}

/** Place 7 rubric-backed specs on SA slots; 23 MCQ specs on remaining slots. */
function normalizeSpecs(specs, categoryId) {
  const saSlots = [2, 6, 10, 14, 18, 22, 26]
  const mcqSlots = [...Array(30).keys()].filter((i) => !saSlots.includes(i))
  const saSpecs = specs.filter((s) => s.rubric?.trim())
  const mcqSpecs = specs.filter((s) => Array.isArray(s.options) && s.options.length === 4)
  if (saSpecs.length !== 7 || mcqSpecs.length !== 23) {
    throw new Error(
      `${categoryId}: need 7 SA + 23 MCQ specs, got ${saSpecs.length} SA + ${mcqSpecs.length} MCQ`,
    )
  }
  const ordered = new Array(30)
  saSlots.forEach((idx, i) => {
    ordered[idx] = saSpecs[i]
  })
  mcqSlots.forEach((idx, i) => {
    ordered[idx] = mcqSpecs[i]
  })
  return ordered
}

// ---------------------------------------------------------------------------
// Question banks — each array has exactly 30 entries (MCQ fields OR SA fields)
// ---------------------------------------------------------------------------

const READING_COMPREHENSION = [
  {
    tag: "[Reading · Policy]",
    artifact: "> **Employee Handbook — Paid Time Off (excerpt)**\n> Full-time employees accrue 1.25 PTO days per month starting on their hire date. Accrual pauses during unpaid leave longer than 14 calendar days. PTO requests require manager approval at least 5 business days before the first day off, except for emergency sick leave.",
    question: "An employee hired March 1 takes 10 unpaid days starting June 1. When does PTO accrual resume?",
    options: ["June 1", "June 11", "June 15", "July 1"],
    correct: 2,
  },
  {
    tag: "[Reading · Email]",
    artifact: "> **From:** ops-leads@company.com\n> **Subject:** Q3 maintenance window\n> **Body:** We will migrate the billing database Saturday 02:00–06:00 UTC. Checkout will be read-only; invoices already queued will still send. Rollback plan is documented in RUN-4821. Reply-all only for blockers.",
    question: "Which customer-facing action remains available during the window?",
    options: [
      "Placing new checkout orders",
      "Sending invoices already in the queue",
      "Editing saved payment methods",
      "Downloading historical invoices",
    ],
    correct: 1,
  },
  {
    tag: "[Reading · Meeting notes]",
    artifact: "> **Design review — Checkout refresh (2026-07-08)**\n> - PM: ship guest checkout in phase 1; account linking deferred.\n> - Legal: cookie banner must block analytics until consent.\n> - Eng: estimate 3 sprints if fraud rules stay unchanged.\n> - **Action:** PM to circulate revised wireframes by Friday.",
    question: "In one sentence, what is the PM's assigned follow-up and its deadline?",
    rubric:
      "Must state PM will circulate/send revised wireframes and that the deadline is Friday (2026-07-11 acceptable). No need to mention other topics.",
    exact: "Circulate revised wireframes by Friday.",
  },
  {
    tag: "[Reading · FAQ]",
    artifact: "> **Internal IT FAQ — VPN**\n> Q: Can I use split tunneling?\n> A: No. All traffic must route through corporate VPN on managed laptops.\n> Q: What if my home ISP blocks UDP 443?\n> A: Switch to TCP profile \"corp-tcp\" in the VPN client settings.",
    question: "A developer's home network blocks UDP 443. What should they do first?",
    options: [
      "Enable split tunneling",
      "Switch to the corp-tcp profile",
      "Disable the VPN during builds",
      "Request a static IP from IT",
    ],
    correct: 1,
  },
  {
    tag: "[Reading · Memo]",
    artifact: "> **Facilities memo — Denver office**\n> Badge access to floors 3–5 is unchanged. Floor 6 lab moves to Building B on Aug 1; until then, escorted access only via reception. Parking validation for visitors ends July 31.",
    question: "Before August 1, how can an employee enter the floor 6 lab?",
    options: [
      "Using their existing badge",
      "Escorted access through reception",
      "Self-service kiosk on floor 6",
      "Temporary badge from Facilities",
    ],
    correct: 1,
  },
  {
    tag: "[Reading · Spec snippet]",
    artifact: "```\nFeature: Invoice PDF export\n- Must include remittance address block\n- Line items sorted by service date ascending\n- Tax shown only when tax_code present\n- Filename: INV-{invoice_id}.pdf\n```",
    question: "Which requirement applies when tax_code is absent?",
    options: [
      "Show tax as $0.00",
      "Omit the tax line entirely",
      "Use a default tax rate of 8.25%",
      "Block PDF generation",
    ],
    correct: 1,
  },
  {
    tag: "[Reading · Contract clause]",
    artifact: "> **MSA Section 4.2 — Data retention**\n> Customer data is deleted within 30 days of contract termination unless a litigation hold notice is active. Backups rotate every 7 days and are purged after 35 days. Holds supersede automatic deletion.",
    question: "A customer terminates on July 1 with no litigation hold. By what date must primary customer data be deleted?",
    rubric:
      "Must compute 30 days after July 1 → July 31 (or 'within 30 days of termination'). Should not cite backup rotation unless noting primary data deadline.",
    exact: "July 31, 2026",
  },
  {
    tag: "[Reading · Release notes]",
    artifact: "> **App v4.12.0**\n> - Fixed: push notifications duplicated on Android 14.\n> - Changed: session timeout now 30 minutes of inactivity (was 60).\n> - Known issue: CSV export truncates notes over 2,000 characters — fix planned v4.12.1.",
    question: "A user reports missing text in exported CSV notes. What is the best immediate guidance?",
    options: [
      "Clear app cache and retry export",
      "Wait for v4.12.1 or shorten notes before export",
      "Disable session timeout in settings",
      "Reinstall the app to fix notifications",
    ],
    correct: 1,
  },
  {
    tag: "[Reading · SLA excerpt]",
    artifact: "> **Support SLA — Business tier**\n> P1: 15-minute first response, updates every hour until mitigated.\n> P2: 1-hour first response, updates every 4 hours.\n> P3: Next business day first response.\n> Maintenance windows excluded from SLA clocks.",
    question: "A P2 ticket is opened at 09:00 on a business day. By when must the first agent response occur?",
    options: ["09:15", "09:30", "10:00", "Next business day"],
    correct: 2,
  },
  {
    tag: "[Reading · Handbook]",
    artifact: "> **Expense policy — Meals**\n> Individual meals while traveling: up to $45 USD per day in the US, $55 in Canada. Alcohol is not reimbursable. Receipts required over $25. Team dinners require pre-approval when expected to exceed $75 per person.",
    question: "A traveler in Austin submits a $38 lunch receipt with no alcohol. Is pre-approval required?",
    options: [
      "Yes, all meals need pre-approval",
      "No, it is within the daily cap and under $75 team threshold",
      "Yes, because it exceeds $25",
      "No, but alcohol must be itemized",
    ],
    correct: 1,
  },
  {
    tag: "[Reading · Policy table]",
    artifact: "| Role | Can approve PO | Max amount (USD) |\n|------|----------------|------------------|\n| Manager | Yes | 5,000 |\n| Director | Yes | 25,000 |\n| VP | Yes | 100,000 |\n| Individual contributor | No | — |",
    question: "A manager submits a $6,200 PO for approval. Who must approve it per the table?",
    rubric: "Must identify Director or higher (manager cap is $5,000). Credit for citing the $5,000 manager limit.",
    exact: "Director or higher",
  },
  {
    tag: "[Reading · Email thread]",
    artifact: "> **From:** vendor@acmesupply.com\n> **Subject:** Partial shipment #8841\n> **Body:** Line 3 (SKU-992) backordered 3 weeks. Lines 1–2 shipped today via FedEx 7844 1234 5678. Remaining items will ship no partial credits until full order ships unless you cancel line 3.",
    question: "Which items shipped today?",
    options: ["Line 3 only", "Lines 1 and 2", "All lines on the PO", "None — entire order backordered"],
    correct: 1,
  },
  {
    tag: "[Reading · Spec]",
    artifact: "```\nAPI: POST /v1/refunds\n- Idempotency-Key header required\n- Partial refunds allowed if amount <= captured_amount\n- Refunds to original payment method only\n- 409 if charge still pending capture\n```",
    question: "A support agent retries the same refund request with the same Idempotency-Key after a timeout. Expected behavior?",
    options: [
      "Duplicate refund is created",
      "Original refund result is returned (idempotent)",
      "409 conflict always",
      "Refund routes to store credit",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Reading · Internal memo]",
    artifact: "> **HR memo — Performance cycle**\n> Self-reviews open Aug 1; manager reviews due Aug 21. Calibration is Aug 25–27. Employees on leave >30 days by Aug 1 use simplified review template unless they request standard.",
    question: "When are manager-written reviews due?",
    options: ["Aug 1", "Aug 21", "Aug 25", "Aug 27"],
    correct: 1,
  },
  {
    tag: "[Reading · Policy exceptions]",
    artifact: "> **Remote work policy**\n> Core hours 10:00–15:00 local time. Two office days/month required for roles tagged \"onsite-flex.\" Exceptions for medical accommodation documented with HR only — not manager discretion.",
    question: "An employee asks their manager to waive office days due to childcare. What does policy require?",
    rubric:
      "Must state exceptions go through HR / documented accommodation — not informal manager waiver. Credit for citing core hours only if tied to wrong path.",
    exact: null,
  },
  {
    tag: "[Reading · RFP excerpt]",
    artifact: "> **RFP scoring — Section 2**\n> Price 30%, Implementation timeline 25%, References 20%, Security questionnaire 25%. Vendors missing SOC 2 Type II at submission are disqualified regardless of score.",
    question: "A vendor scores highest on price and timeline but lacks SOC 2 Type II at submission. Outcome?",
    options: ["Wins with conditional approval", "Disqualified", "Scores capped at 70%", "Enters pilot only"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Reading · Meeting notes]",
    artifact: "> **Incident review — API latency**\n> Root cause: connection pool mis-sized after scale-up. Mitigation: pool max raised 50→200. Follow-up: add autoscaling alert on pool wait time >100ms. **Not in scope:** client retry logic change.",
    question: "Which follow-up item was explicitly marked out of scope?",
    options: [
      "Raising connection pool max",
      "Autoscaling alert on pool wait time",
      "Changing client retry logic",
      "Documenting root cause",
    ],
    correct: 2,
  },
  {
    tag: "[Reading · Vendor email]",
    artifact: "> **From:** billing@cloudhost.io\n> Your reserved instance discount applies only to us-east-1 Linux instances tagged `env=prod`. Discount does not apply to Windows or spot instances. True-up invoices post quarterly.",
    question: "Which instance would NOT receive the reserved discount?",
    options: [
      "Linux in us-east-1 tagged env=prod",
      "Windows in us-east-1 tagged env=prod",
      "Linux spot in us-east-1 tagged env=prod",
      "Both Windows and Linux spot",
    ],
    correct: 3,
    resistance: "high",
  },
  {
    tag: "[Reading · Compliance bulletin]",
    artifact: "> **Privacy bulletin — Q2**\n> New DSAR workflow: legal triage within 2 business days; fulfillment within 30 calendar days. Marketing opt-out requests still route to marketing@, not legal.",
    question: "Summarize who handles a marketing unsubscribe request vs. a formal DSAR.",
    rubric:
      "Must distinguish marketing opt-out → marketing@ (or marketing team) vs DSAR → legal workflow with triage/30-day fulfillment. Both paths required.",
    exact: null,
  },
  {
    tag: "[Reading · Product brief]",
    artifact: "> **Brief — Vendor portal MVP**\n> Must-have: invoice upload, status tracking. Nice-to-have: chat. Out of scope: payment processing (phase 2). Launch target: Oct 15 if security review completes by Sep 1.",
    question: "Is payment processing included in the MVP scope?",
    options: ["Yes, required for launch", "No, deferred to phase 2", "Only for US vendors", "Only if chat ships"],
    correct: 1,
  },
  {
    tag: "[Reading · Policy cross-reference]",
    artifact: "> **Travel — Booking**\n> Fly economy under 6 hours; business class requires VP pre-approval. **Car rental:** compact class default; upgrades with safety justification only.\n>\n> **Travel — Reimbursement**\n> Personal loyalty points cannot be reimbursed; only out-of-pocket amounts.",
    question: "An employee books business class for a 4-hour flight using personal points plus $200 copay. Which policy applies to the copay reimbursement?",
    options: [
      "Economy cap applies; copay not reimbursable",
      "Business class forbidden; copay not reimbursable",
      "VP approval needed; only $200 reimbursable if approved",
      "Full fare reimbursable because points used",
    ],
    correct: 2,
  },
  {
    tag: "[Reading · Legal summary]",
    artifact: "> **NDA summary (non-lawyer)**\n> 3-year term; mutual; covers business info marked confidential or reasonably understood confidential. Excludes public info and independently developed work. Injunction remedy available for breach.",
    question: "Engineer rebuilds a feature from public documentation without using confidential docs. NDA breach?",
    options: [
      "Yes, all features are covered",
      "No, public info and independent development are excluded",
      "Yes, unless marked non-confidential",
      "Only if marked top secret",
    ],
    correct: 1,
  },
  {
    tag: "[Reading · Multi-doc scenario]",
    artifact: "> **Email:** \"Please enable feature flag `beta_reports` for Acme only.\"\n>\n> **Flag registry:**\n> `beta_reports` — default off; allowed tenants: acme, beta-corp; requires analytics consent flag `analytics_on`.\n>\n> **Acme tenant record:** analytics_on = false",
    question: "List the steps (in order) to enable `beta_reports` for Acme.",
    rubric: "Must enable/set analytics_on first, then enable beta_reports for Acme tenant. Order matters; credit for noting both flags.",
    exact: "Enable analytics_on, then enable beta_reports for Acme.",
    resistance: "high",
  },
  {
    tag: "[Reading · Audit finding]",
    artifact: "> **Internal audit — Access reviews**\n> Finding: 12 contractors retained VPN access >30 days after end date. Policy requires removal within 24 hours. Root cause: offboarding ticket not linked to IAM workflow.",
    question: "What process fix best addresses the root cause?",
    options: [
      "Quarterly manual VPN audit",
      "Link offboarding tickets to IAM deprovisioning",
      "Disable all contractor VPN",
      "Require MFA for contractors",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Reading · Escalation policy]",
    artifact: "> **Escalation matrix**\n> Billing disputes >$10k → Finance director within 4 business hours.\n> Security incidents with data exposure → CISO immediately, then legal within 1 hour.\n> PR inquiries → Comms only; do not comment on active incidents.",
    question: "Media asks about a suspected data exposure. Who should respond first per policy?",
    options: ["Engineering on-call", "Comms team", "CISO with technical details", "Legal directly to media"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Reading · Change log]",
    artifact: "> **Pricing update memo**\n> Effective Sep 1: Pro plan $49→$59/month; Grandfathering until Dec 31 for contracts signed before Aug 15. Enterprise custom — unaffected.",
    question: "A customer signed Pro on Aug 10. When does the new price apply?",
    rubric:
      "Must use grandfathering rule: price stays $49 until Dec 31, then $59 (or new price after grandfather ends). Aug 10 is before Aug 15 cutoff.",
    exact: "January 1, 2027 (after Dec 31 grandfathering)",
  },
  {
    tag: "[Reading · Cross-functional brief]",
    artifact: "> **Launch brief excerpt**\n> Marketing may announce GA on Sep 10 only if: (1) SOC 2 letter received, (2) support runbooks published, (3) rollback tested in staging. Engineering sign-off alone is insufficient.",
    question: "Engineering certifies rollback tested, but runbooks are draft. Can marketing announce GA on Sep 10?",
    options: ["Yes, engineering sign-off is enough", "No, all three gates required", "Yes, if SOC 2 letter received", "Announce as beta instead"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Reading · Regulatory notice]",
    artifact: "> **State notice — Sales tax nexus**\n> Remote sellers must collect tax in State X once sales exceed $100,000 or 200 transactions in the prior calendar year. Registration required within 30 days of threshold crossing.",
    question: "Company hit $105,000 in State X sales on Nov 15. Registration deadline?",
    options: ["Nov 15", "Dec 15", "Jan 1 next year", "Immediately same day"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Reading · Board summary]",
    artifact: "> **Board risk summary**\n> Top risk: vendor concentration (42% spend on Vendor A). Mitigation: dual-source critical components by Q2 next year. **Do not disclose** un-audited churn figures externally.",
    question: "Which topic is flagged as not for external disclosure?",
    options: ["Vendor concentration", "Dual-sourcing plan", "Un-audited churn figures", "Q2 timeline"],
    correct: 2,
    resistance: "high",
  },
  {
    tag: "[Reading · Policy synthesis]",
    artifact: "> **Data classification**\n> Public / Internal / Confidential / Restricted.\n>\n> **Email DLP rule:** Restricted data may not leave the org via email. Confidential may leave only to approved domains list.\n>\n> **Approved domains:** `@partnerco.com`, `@auditfirm.com`",
    question: "An employee emails a Confidential spreadsheet to `@clientstartup.io`. Allowed?",
    options: [
      "Yes, Confidential has no restrictions",
      "No, domain not on approved list",
      "Yes, if encrypted",
      "No, must be Restricted only",
    ],
    correct: 1,
    resistance: "high",
  },
]

const ATTENTION_TO_DETAIL = [
  {
    tag: "[Detail · Invoice]",
    artifact: "| Line | SKU | Qty | Unit (USD) | Extended |\n|------|-----|-----|------------|----------|\n| 1 | A-100 | 10 | 12.50 | 125.00 |\n| 2 | B-200 | 5 | 8.00 | 40.00 |\n| 3 | C-300 | 2 | 15.00 | 30.00 |\n| | | | **Subtotal** | **195.00** |",
    question: "Which line has a math error between qty × unit and extended amount?",
    options: ["Line 1", "Line 2", "Line 3", "No error — subtotal is wrong"],
    correct: 3,
  },
  {
    tag: "[Detail · Form]",
    artifact: "> **Vendor onboarding form (excerpt)**\n> Legal name: Acme Supply LLC\n> Tax ID: 84-3928174\n> Bank routing: 021000021\n> Account: 483920174\n> W-9 attached: ☐ Yes ☑ No",
    question: "What is missing before payment can legally proceed?",
    options: ["Routing number", "Tax ID", "Attached W-9", "Legal name"],
    correct: 2,
  },
  {
    tag: "[Detail · Spec pair]",
    artifact: "> **UI spec:** Primary button label = \"Save changes\"\n>\n> **Screenshot caption:** Submit button saves profile updates.",
    question: "Describe the mismatch between spec and caption.",
    rubric: "Must note label text mismatch (Save changes vs Submit) and/or that both refer to profile save action but wording differs. Credit for calling out inconsistent terminology.",
    exact: null,
  },
  {
    tag: "[Detail · Timesheet]",
    artifact: "| Day | In | Out | Break (min) | Hours |\n|-----|-----|-----|-------------|-------|\n| Mon | 09:00 | 17:30 | 30 | 8.0 |\n| Tue | 09:00 | 17:00 | 30 | 7.5 |\n| Wed | 08:30 | 17:30 | 30 | 8.5 |",
    question: "Which row's Hours column does not match In/Out/Break?",
    options: ["Monday", "Tuesday", "Wednesday", "All rows correct"],
    correct: 0,
  },
  {
    tag: "[Detail · Shipping label]",
    artifact: "> **Ship to:** 742 Evergreen Terrace, Springfield, IL 62704\n> **Bill to:** 742 Evergreen Ter., Springfield, IL 62704\n> **PO:** PO-88421\n> **Carton 2 of 2:** PO-88422",
    question: "Which identifier is inconsistent across the label?",
    options: ["City/state", "Street address formatting", "PO number on carton count", "Zip code"],
    correct: 2,
  },
  {
    tag: "[Detail · Email header]",
    artifact: "> **From:** alerts@payments.co\n> **Reply-To:** support@payments.co\n> **Subject:** [PROD] Payout batch #9912 failed\n> **Date:** Tue, 15 Jul 2026 14:03:00 +0000\n> **X-Environment:** staging",
    question: "Which field suggests this alert may not be from production?",
    options: ["Reply-To domain", "Subject tag [PROD]", "X-Environment value", "Date timezone"],
    correct: 2,
  },
  {
    tag: "[Detail · Contract table]",
    artifact: "| Milestone | Due | Amount (USD) | Status |\n|-----------|-----|--------------|--------|\n| M1 | 2026-05-01 | 50,000 | Paid |\n| M2 | 2026-07-01 | 50,000 | Invoiced |\n| M3 | 2026-09-01 | 50,000 | Not started |\n| **Total** | | **150,000** | |",
    question: "If M2 should be 45,000 per amendment, what total contract value error exists?",
    rubric: "Must identify $5,000 overstatement (total should be 145,000) or that M2 line is wrong vs total. Accept clear numeric explanation.",
    exact: "Total should be $145,000 (M2 is $5,000 too high).",
  },
  {
    tag: "[Detail · Inventory count]",
    artifact: "| Bin | System qty | Count qty | Delta |\n|-----|------------|-----------|-------|\n| A1 | 120 | 118 | -2 |\n| B4 | 45 | 45 | 0 |\n| C2 | 80 | 83 | +3 |\n| **Sum** | **245** | **246** | **+1** |",
    question: "Do the row deltas sum to the stated total delta?",
    options: ["Yes", "No — should be 0", "No — should be +2", "No — should be -1"],
    correct: 2,
  },
  {
    tag: "[Detail · Calendar invite]",
    artifact: "> **Title:** Q3 planning\n> **Time:** 2026-07-21 10:00–11:00 America/Chicago\n> **Location:** Zoom (link)\n> **Description:** \"Agenda: budgets. Please join at 9am PT.\"",
    question: "What time inconsistency might confuse Pacific attendees?",
    options: [
      "Title mentions Q3 not Q2",
      "9am PT vs 10am CT start mismatch",
      "Missing location",
      "Date is a holiday",
    ],
    correct: 1,
  },
  {
    tag: "[Detail · Receipt]",
    artifact: "> **Cafe receipt**\n> Subtotal: $18.40\n> Tax (8.875%): $1.63\n> Tip: $3.00\n> **Total: $23.03**",
    question: "Is the total arithmetically correct?",
    options: ["Yes", "No — should be $23.13", "No — should be $22.93", "No — tax rate wrong only"],
    correct: 0,
  },
  {
    tag: "[Detail · Data entry]",
    artifact: "| Employee ID | Name | Dept | Manager ID |\n|-------------|------|------|------------|\n| E102 | Ana Ruiz | Sales | M200 |\n| E103 | Ben Lee | Sales | M201 |\n| E104 | Ana Ruiz | Ops | M200 |",
    question: "What data-quality issue should HR fix before the next payroll sync?",
    rubric: "Must flag duplicate/reused name (Ana Ruiz on E102 and E104) and/or E104 dept mismatch vs E102 — possible ID reuse or duplicate person record.",
    exact: null,
    resistance: "high",
  },
  {
    tag: "[Detail · PO vs packing slip]",
    artifact: "> **PO-5510 line 2:** SKU XJ-44, qty 24\n> **Packing slip:** SKU XJ-44, qty 42",
    question: "What discrepancy should receiving flag?",
    options: ["SKU mismatch", "Quantity over-shipment of 18", "Missing line 1", "Wrong PO number"],
    correct: 1,
  },
  {
    tag: "[Detail · Spreadsheet formula]",
    artifact: "| Region | Q1 | Q2 | QoQ % |\n|--------|-----|-----|-------|\n| West | 100 | 120 | 20% |\n| East | 80 | 72 | -10% |\n| East QoQ cell shows: 12% |",
    question: "Which region's QoQ percentage is wrong?",
    options: ["West", "East", "Both", "Neither"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Detail · Access list]",
    artifact: "> **Prod DB readers (Jul 15 export)**\n> - svc_reporting\n> - jsmith (terminated Jun 30)\n> - alee\n> - temp_audit_jul (expires Jul 31)",
    question: "Which entry violates typical access hygiene?",
    options: ["svc_reporting", "jsmith", "alee", "temp_audit_jul"],
    correct: 1,
  },
  {
    tag: "[Detail · Version matrix]",
    artifact: "| Component | Required | Deployed |\n|-----------|----------|----------|\n| api | 2.4.0 | 2.4.0 |\n| worker | 2.4.0 | 2.3.9 |\n| web | 2.4.1 | 2.4.1 |",
    question: "Which deployed version fails the required matrix?",
    options: ["api", "worker", "web", "All match"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Detail · Bank details]",
    artifact: "> **Invoice footer**\n> Wire to: First National Bank\n> Routing (ACH): 111000025\n> Routing (wire): 021000021\n> Account: 998877665\n> **Remittance email:** ap@vendor.com\n> **Remittance email (repeat):** ap@vender.com",
    question: "Identify two detail errors a payer should verify.",
    rubric: "Must catch typo in second email (vender vs vendor) and should note duplicate/conflicting emails or wire vs ACH routing confusion. At least one concrete error required.",
    exact: null,
  },
  {
    tag: "[Detail · Shift schedule]",
    artifact: "| Worker | Shift start | Shift end | Hours |\n|--------|-------------|-----------|-------|\n| Kim | 22:00 | 06:00 | 8.0 |\n| Luis | 06:00 | 14:00 | 8.0 |\n| Sam | 14:00 | 22:00 | 7.0 |",
    question: "Which shift hours column is incorrect?",
    options: ["Kim", "Luis", "Sam", "All correct"],
    correct: 2,
  },
  {
    tag: "[Detail · Tax form]",
    artifact: "> **1099 preview**\n> Recipient TIN: ***-**-4829\n> Amount: $12,450.00\n> Box 1 (Nonemployee comp): $12,450.00\n> Box 4 (Federal tax withheld): $12,450.00",
    question: "Which box value is implausible for a standard 1099-NEC?",
    options: ["Box 1", "Box 4", "TIN masking", "Amount rounding"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Detail · URL params]",
    artifact: "```\nTracking link: https://app.co/reports?view=summary&view=detail&date=2026-07-01&date=2026-07-31\n```",
    question: "What ambiguity should QA flag in this URL?",
    rubric: "Must note duplicate query keys (view, date) with conflicting values — behavior undefined without spec. Credit for suggesting canonical single-value params.",
    exact: null,
  },
  {
    tag: "[Detail · Meeting attendees]",
    artifact: "> **Invite list:** pm@co.com, eng-lead@co.com, legal@co.com\n> **Minutes distribution:** pm@co.com, eng-lead@co.com, finance@co.com\n> **Action owner (legal review):** not listed in minutes distribution",
    question: "Who was on the invite but missing from minutes distribution?",
    options: ["pm@co.com", "eng-lead@co.com", "legal@co.com", "finance@co.com"],
    correct: 2,
  },
  {
    tag: "[Detail · Unit conversion]",
    artifact: "> **Spec:** Cable length 15 ft\n> **Vendor quote:** 4.5 m (~14.8 ft)\n> **Warehouse label:** 15 m",
    question: "Which document likely has the unit error?",
    options: ["Spec", "Vendor quote", "Warehouse label", "All consistent"],
    correct: 2,
  },
  {
    tag: "[Detail · Duplicate payment]",
    artifact: "| Payment ID | Invoice | Amount | Date |\n|------------|---------|--------|------|\n| P-901 | INV-2201 | 1,200 | Jul 10 |\n| P-915 | INV-2201 | 1,200 | Jul 12 |\n| P-920 | INV-2203 | 800 | Jul 12 |",
    question: "Which payments suggest a duplicate pay risk?",
    options: ["P-901 only", "P-901 and P-915", "P-920 only", "All three"],
    correct: 1,
  },
  {
    tag: "[Detail · Config drift]",
    artifact: "```yaml\n# staging.yaml\nrate_limit: 1000\nfeature_x: true\n\n# prod.yaml (exported)\nrate_limit: 100\nfeature_x: true\nfeature_y: true\n```",
    question: "Which prod change most likely causes user-visible throttling, and what value differs?",
    rubric: "Must identify rate_limit dropped from 1000 to 100 in prod. Optional note feature_y is prod-only but throttling tied to rate_limit.",
    exact: "rate_limit: 100 in prod vs 1000 in staging",
    resistance: "high",
  },
  {
    tag: "[Detail · Name mismatch]",
    artifact: "> **Passport name:** OLIVIA CHEN\n> **Payroll name:** Olivia Chen-Wu\n> **Bank account name:** O. Chen",
    question: "Which record is most likely to fail bank verification for payroll deposit?",
    options: ["Passport vs payroll", "Bank account name vs payroll legal name", "All match sufficiently", "Passport vs bank only"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Detail · SLA tracker]",
    artifact: "| Ticket | Priority | Opened | First response | SLA met? |\n|--------|----------|--------|----------------|----------|\n| T-1 | P1 | 09:00 | 09:10 | Yes |\n| T-2 | P1 | 09:00 | 09:20 | Yes |\n| T-3 | P2 | 09:00 | 10:05 | Yes |",
    question: "P1 SLA is 15-minute first response; P2 is 1 hour. Which row is mis-tagged as SLA met?",
    options: ["T-1", "T-2", "T-3", "None"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Detail · BOM compare]",
    artifact: "| Part | Rev A qty | Rev B qty |\n|------|-----------|-----------|\n| Screw M4 | 12 | 12 |\n| Bracket | 2 | 3 |\n| Gasket | 1 | 1 |",
    question: "Which part changed quantity between revisions?",
    rubric: "Must identify Bracket qty 2→3. Optional mention others unchanged.",
    exact: "Bracket (2 to 3)",
  },
  {
    tag: "[Detail · Timezone log]",
    artifact: "> **Event log (UTC)**\n> deploy_start: 2026-07-15T23:30:00Z\n> deploy_end: 2026-07-16T00:15:00Z\n> **Change ticket:** \"Maintenance 6:30–7:15 PM America/Los_Angeles\"",
    question: "Do UTC timestamps align with the ticket window?",
    options: ["Yes", "No — start 1 hour early", "No — end 1 hour late", "No — wrong date entirely"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Detail · Multi-table]",
    artifact: "> **HR roster:** Employee E77 — Dept: Finance\n> **Active directory:** E77 — Dept: Engineering\n> **Payroll cost center:** 4100 (Finance)",
    question: "Which system is most likely out of sync?",
    options: ["HR roster", "Active directory", "Payroll cost center", "All aligned"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Detail · Footer totals]",
    artifact: "| Page | Line items sum | Page total shown |\n|------|----------------|------------------|\n| 1 | 4,250.00 | 4,250.00 |\n| 2 | 3,780.50 | 3,870.50 |\n| **Report total** | **8,030.50** | **8,120.50** |",
    question: "Where is the first arithmetic break?",
    options: ["Page 1", "Page 2", "Report total only", "No break"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Detail · Serial range]",
    artifact: "> **Shipment note:** Serials SN-1000 through SN-1049 (50 units)\n> **Received scan log:** 48 unique serials, highest SN-1048, missing SN-1007 and SN-1022",
    question: "How many units are short vs the note, assuming serials are unique?",
    options: ["0", "1", "2", "50"],
    correct: 2,
    resistance: "high",
  },
]

const FOLLOWING_INSTRUCTIONS = [
  {
    tag: "[Instructions · Onboarding checklist]",
    artifact: "> 1. Create account in IdP.\n> 2. Assign `contractor` role — not `employee`.\n> 3. Submit background check **before** granting VPN.\n> 4. Send welcome email only after steps 1–3 complete.",
    question: "Background check cleared today; IdP account exists with `employee` role. What is the next corrective step?",
    options: [
      "Send welcome email",
      "Grant VPN immediately",
      "Change role to `contractor` then continue step 3–4 order",
      "Skip VPN for contractors",
    ],
    correct: 2,
  },
  {
    tag: "[Instructions · Support macro]",
    artifact: "> **Refund macro SOP**\n> - Confirm order ID and delivery date.\n> - If delivered >30 days ago, escalate to Tier 2 — do not refund.\n> - If ≤30 days, refund shipping only on defective items; full refund on wrong item shipped.",
    question: "Wrong item delivered 12 days ago. Which path applies?",
    options: ["Escalate Tier 2", "Shipping-only refund", "Full refund", "No refund — too soon"],
    correct: 2,
  },
  {
    tag: "[Instructions · Lab procedure]",
    artifact: "> **Sample prep SOP**\n> 1. Label tubes before opening reagent.\n> 2. Incubate 10 min at 37°C — do not exceed 12 min.\n> 3. Centrifuge 5 min at 3000 rpm.\n> 4. Record batch ID in log before reading results.",
    question: "You incubated 13 minutes. What should you do before centrifuging?",
    rubric: "Must say discard/restart or do not proceed / repeat prep per SOP — exceeding 12 min invalidates step. Credit for not continuing to centrifuge.",
    exact: "Discard and restart; do not centrifuge this sample.",
  },
  {
    tag: "[Instructions · Shipping SOP]",
    artifact: "> **Cold chain ship**\n> - Pre-chill gel packs 24 hours.\n> - Pack product only after gel packs register ≤4°C.\n> - Seal with tamper tape; attach logger **before** handoff to carrier.\n> - Enter tracking in TMS within 30 minutes of pickup.",
    question: "Gel packs are at 6°C after 24h chill. Next step?",
    options: [
      "Pack immediately",
      "Continue chilling until ≤4°C then proceed",
      "Skip logger if traffic is heavy",
      "Hand off to carrier and enter tracking later",
    ],
    correct: 1,
  },
  {
    tag: "[Instructions · IT change]",
    artifact: "> **Production deploy checklist**\n> 1. Announce in #changes\n> 2. Snapshot DB\n> 3. Deploy canary 5%\n> 4. Monitor 15 min; rollback if error rate >1%\n> 5. Full rollout only after canary pass",
    question: "Canary error rate hits 1.2% at minute 10. Required action?",
    options: ["Proceed to full rollout", "Wait until minute 15 then decide", "Rollback immediately", "Announce in #changes again"],
    correct: 2,
  },
  {
    tag: "[Instructions · Finance]",
    artifact: "> **Month-end close**\n> - Lock subledgers through day T-2.\n> - Post accruals only from template AC-400 series.\n> - No manual journal entries without controller approval code `MC-OK`.",
    question: "An accrual uses template AC-410 but lacks `MC-OK`. Post it?",
    options: ["Yes, AC-410 is in AC-400 series", "Yes, if amount < $1,000", "No, need controller approval code", "Post then request approval"],
    correct: 2,
  },
  {
    tag: "[Instructions · Event runbook]",
    artifact: "> **Webinar go-live**\n> 1. Host joins 20 min early.\n> 2. Mute all attendees on entry.\n> 3. Start recording only after legal disclaimer slide shown.\n> 4. Q&A opens after slide 12 — not before.",
    question: "Attendees ask questions during slide 8. What should the host do?",
    rubric: "Must defer Q&A until after slide 12 per runbook; may hold questions or use chat. Wrong if opening Q&A early.",
    exact: "Defer Q&A until after slide 12; keep attendees muted per SOP.",
  },
  {
    tag: "[Instructions · Security]",
    artifact: "> **Visitor badge SOP**\n> - Photo ID required.\n> - Escort mandatory on floors 2+.\n> - Badge must be visible; return at exit.\n> - Exception: pre-approved auditors list — escort optional on floor 2 only.",
    question: "Pre-approved auditor visits floor 3 without escort. Allowed?",
    options: ["Yes, auditors are exempt everywhere", "Yes, on floor 2 only per exception", "No, floor 3 requires escort", "Yes, if badge visible"],
    correct: 2,
  },
  {
    tag: "[Instructions · Customer comms]",
    artifact: "> **Outage comms template order**\n> 1. Acknowledge impact\n> 2. State scope (regions/features)\n> 3. Provide workaround if any\n> 4. ETA or next update time\n> **Do not** speculate on root cause externally.",
    question: "Which sentence violates the template?",
    options: [
      "\"We are investigating elevated errors in us-east-1.\"",
      "\"Likely caused by a bad deploy by engineer Alex.\"",
      "\"Next update in 30 minutes.\"",
      "\"Workaround: use CSV export instead of API.\"",
    ],
    correct: 1,
  },
  {
    tag: "[Instructions · Inventory]",
    artifact: "> **Cycle count SOP**\n> - Count bin before moving stock.\n> - Two-person verify if variance >5%.\n> - Adjust system only after supervisor sign-off in app.",
    question: "Counter finds 8% variance and adjusts system immediately. What was skipped?",
    options: ["Moving stock first", "Two-person verify and supervisor sign-off", "Counting after move", "Using paper log only"],
    correct: 1,
  },
  {
    tag: "[Instructions · Exception path]",
    artifact: "> **Travel booking**\n> Standard: book 14+ days ahead.\n> Exception: <14 days requires director email attached to expense report.\n> Emergency: VP approval + incident ticket number on report.",
    question: "Flight booked 5 days ahead for family event. What documentation must attach to the expense report?",
    rubric: "Director email required (<14 days, non-emergency). Must NOT say VP/incident ticket unless framed as emergency.",
    exact: "Director email attached to expense report",
    resistance: "high",
  },
  {
    tag: "[Instructions · Data deletion]",
    artifact: "> **DSAR deletion runbook**\n> 1. Verify identity ticket #.\n> 2. Export audit log copy to legal bucket.\n> 3. Delete primary profile rows.\n> 4. Queue backup purge job — do not mark complete until job ID recorded.",
    question: "Primary rows deleted; backup job running but no job ID logged. Mark DSAR complete?",
    options: ["Yes, primary delete is enough", "Yes, if job will finish tonight", "No, record job ID before complete", "Close ticket; legal handles backups"],
    correct: 2,
  },
  {
    tag: "[Instructions · Manufacturing]",
    artifact: "> **Line changeover**\n> - Stop line\n> - Clear previous SKU remnants\n> - QA sign-off on first article\n> - Update line display SKU\n> - Restart only after all four",
    question: "Line display updated; first article pending QA. Restart?",
    options: ["Yes, display is updated", "No, wait for QA sign-off and prior steps", "Yes, if remnants look minimal", "Restart at half speed"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Hiring]",
    artifact: "> **Interview loop**\n> - Recruiter screen → hiring manager → panel (2) → bar raiser optional for L5+.\n> - No offer until reference check **and** background initiated.\n> - Compensation only via comp band tool output attached.",
    question: "Panel complete for L4 role; references pending. Can extend verbal offer?",
    options: ["Yes, after panel", "Yes, if hiring manager approves", "No, references and background initiation required", "Yes, with comp band tool"],
    correct: 2,
  },
  {
    tag: "[Instructions · Branching SOP]",
    artifact: "> **Incident severity**\n> - If PII exposed: page security + legal immediately.\n> - If revenue impact >$50k/hr: page finance director.\n> - Else if customer-facing outage: page comms liaison.\n> - Otherwise: standard on-call.",
    question: "Customer-facing outage, no PII, $10k/hr impact. Who gets paged?",
    rubric: "Must page comms liaison per branch (customer-facing outage) and NOT skip to finance (under $50k) or security (no PII).",
    exact: "Comms liaison",
  },
  {
    tag: "[Instructions · Procurement]",
    artifact: "> **3-quote rule:** Purchases >$2,500 need three quotes unless single-source memo approved by procurement.\n> Single-source memo must cite patent/exclusivity or emergency with VP sign-off.",
    question: "$4,000 specialized OEM part; only one vendor exists (patent). Required step?",
    options: [
      "Three quotes anyway",
      "Single-source memo approved by procurement",
      "Split into two POs",
      "Verbal VP OK",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Content publish]",
    artifact: "> **Blog publish checklist**\n> Legal review for claims → SEO metadata → scheduled publish ET → post-publish cache purge.\n> **Never** publish from draft URL directly to production DNS.",
    question: "Legal cleared; metadata done. Next step before live?",
    options: ["Publish from draft URL", "Schedule publish ET then cache purge after live", "Cache purge before schedule", "Skip legal on updates"],
    correct: 1,
  },
  {
    tag: "[Instructions · Parallel tasks]",
    artifact: "> **Office move weekend**\n> Sat: network install must finish before phone port at 18:00.\n> Sun: furniture after network validation checklist signed.\n> Sign-off owner: facilities only after IT checklist attached.",
    question: "Phones port at 18:00 Sat; network install still in progress. Action?",
    options: ["Port phones anyway", "Delay phone port until network complete and validated", "Move furniture first", "Facilities sign-off without IT"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Escalation timer]",
    artifact: "> **Tier 1 SOP:** Attempt KB fixes for 20 min.\n> If unresolved, collect logs and escalate to Tier 2 with template T2-escalate.\n> **Do not** promise refund timelines — Tier 2 only.",
    question: "After 15 min KB attempts, customer demands refund ETA. Best response?",
    rubric: "Continue KB 20 min rule OR escalate with logs if issue warrants; must not promise refund timeline as Tier 1. Credit for citing SOP boundaries.",
    exact: null,
  },
  {
    tag: "[Instructions · Conditional steps]",
    artifact: "> **Equipment return**\n> - If laptop: wipe via MDM then physical inspection.\n> - If monitor: inspection only.\n> - Charge damage fee only with photo upload in ticket.\n> - Close ticket only when asset status = `returned` in CMDB.",
    question: "Monitor returned; inspection OK; CMDB still `assigned`. Close ticket?",
    options: ["Yes, inspection passed", "No, update CMDB to returned first", "Yes, with photo", "Charge fee by default"],
    correct: 1,
  },
  {
    tag: "[Instructions · Order of operations]",
    artifact: "> **Batch email send**\n> 1. Send test to internal list\n> 2. Wait 10 min; confirm links tracked\n> 3. Upload final recipient CSV\n> 4. Enable send; cap 50k/hour",
    question: "Final CSV uploaded; internal test skipped. Proceed?",
    options: ["Yes, if links look fine", "No, complete test and 10-min wait first", "Yes, with lower cap", "Skip cap for small lists"],
    correct: 1,
  },
  {
    tag: "[Instructions · Override rules]",
    artifact: "> **Discount approval**\n> Reps: up to 10%.\n> Managers: up to 20% with CRM opportunity link.\n> >20%: VP + finance tag `margin-exception`.\n> **Stacking:** promo codes cannot combine with rep discount.",
    question: "Rep applies 8% discount plus a 5% promo code on the same deal. Allowed? Explain.",
    rubric: "Not allowed — stacking promo with rep discount is forbidden even if combined % is under manager cap.",
    exact: "No — stacking promo codes with rep discount is forbidden.",
  },
  {
    tag: "[Instructions · Multi-team handoff]",
    artifact: "> **Facility leak response**\n> 1. Safety: evacuate affected zone.\n> 2. Facilities: shut valve.\n> 3. IT: power down racks in zone after Facilities all-clear.\n> 4. Comms: notify tenants after Safety all-clear.",
    question: "Facilities shut valve; IT already powered racks down during evacuation. What went wrong?",
    options: [
      "Comms should go first",
      "IT acted before Facilities all-clear",
      "Evacuation optional",
      "Nothing — faster is better",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Document version]",
    artifact: "> **SOP header:** Effective 2026-07-01 Rev C — supersedes Rev B.\n> Rev B said: dispose chemical X in drain A.\n> Rev C says: chemical X to hazardous waste vendor only.",
    question: "Technician follows Rev B printout on July 15. Correct action?",
    options: ["Follow Rev B if printed", "Follow Rev C hazardous waste rule", "Mix both procedures", "Ask drain supervisor"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Time-bound exception]",
    artifact: "> **Password reset window:** Self-service allowed 06:00–22:00 local.\n> After hours: verified callback to listed mobile on file only — no email reset links.",
    question: "User requests email reset link at 23:30. Proper path?",
    options: ["Send email link anyway", "Verified callback to mobile on file", "Wait until 06:00", "Manager override via email"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Audit trail]",
    artifact: "> **Manual price override SOP**\n> Enter reason code, attach approval email, update price, **then** notify billing audit channel — in that order.",
    question: "Price updated and audit channel notified; reason code missing. Compliant?",
    rubric: "Not compliant — reason code and approval must precede price update per order. Must note fix: add reason/approval retroactively or redo in order.",
    exact: "No — reason code and approval must be recorded before price update.",
  },
  {
    tag: "[Instructions · Nested conditions]",
    artifact: "> **Return merchandise**\n> - Opened software: no return.\n> - Unopened hardware ≤30 days: full refund.\n> - Unopened hardware >30 days: store credit.\n> - Defective: full refund any time with RMA.",
    question: "Unopened laptop day 45, not defective. Outcome?",
    options: ["Full refund", "Store credit", "No return", "Manager discretion full refund"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Communication order]",
    artifact: "> **Layoff day protocol**\n> 1. Employee private notification\n> 2. IT access removal at notification time\n> 3. Team announcement after all affected notified same day\n> 4. Press statement only via corporate comms",
    question: "Team announcement sent before two employees were notified. Issue?",
    options: [
      "None if message is generic",
      "Violates order — private notification must complete first",
      "IT step should be first",
      "Press statement required simultaneously",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Tooling gates]",
    artifact: "> **Merge to main**\n> - CI green\n> - Two approvals\n> - Security scan `pass` or waived ticket\n> - **No merge** during change freeze without CAB ticket",
    question: "CI green, two approvals, scan pass; change freeze active; no CAB ticket. Merge?",
    options: ["Yes, all technical gates pass", "No, CAB required during freeze", "Yes, if hotfix label", "Security waiver replaces CAB"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Instructions · Compound exception]",
    artifact: "> **Wire transfer**\n> >$25k: dual approval.\n> New beneficiary: call-back verification to number on file.\n> International: add compliance form CF-INT.\n> All three apply independently when triggered.",
    question: "$30k to new international vendor. Minimum required controls?",
    options: [
      "Dual approval only",
      "Dual approval + call-back + CF-INT",
      "Call-back only",
      "CF-INT only if >$50k",
    ],
    correct: 1,
    resistance: "high",
  },
]


const APPLIED_NUMERACY = [
  {
    tag: "[Numeracy · Receipt]",
    artifact: "| Item | Qty | Unit (USD) |\n|------|-----|------------|\n| Notebook | 3 | 4.50 |\n| Pens (pack) | 2 | 6.25 |\n| **Subtotal** | | **25.50** |",
    question: "What is the correct subtotal?",
    options: ["$25.50", "$24.00", "$26.75", "$23.50"],
    correct: 0,
  },
  {
    tag: "[Numeracy · Discount]",
    artifact: "> **Store coupon:** 15% off entire purchase. Register shows subtotal $80.00 before tax.",
    question: "What is the discounted subtotal?",
    options: ["$68.00", "$72.00", "$65.00", "$70.00"],
    correct: 0,
  },
  {
    tag: "[Numeracy · Timesheet]",
    artifact: "| Day | Hours |\n|-----|-------|\n| Mon | 8.0 |\n| Tue | 7.5 |\n| Wed | 8.0 |\n| Thu | 8.5 |\n| Fri | 8.0 |",
    question: "Total hours for the week?",
    rubric: "Must sum to 40.0 hours. Accept 40 or 40.0.",
    exact: "40.0",
  },
  {
    tag: "[Numeracy · Mileage]",
    artifact: "> **Expense:** Round trip client site 42 miles each way. Reimbursement $0.67/mile (USD).",
    question: "Total reimbursable mileage amount?",
    options: ["$28.14", "$56.28", "$42.67", "$58.80"],
    correct: 1,
  },
  {
    tag: "[Numeracy · Tip split]",
    artifact: "> **Team lunch bill:** $96.00 before tip. Policy: 20% tip split evenly among 4 attendees.",
    question: "How much does each person pay including their share of tip?",
    options: ["$28.80", "$24.00", "$29.80", "$30.40"],
    correct: 0,
  },
  {
    tag: "[Numeracy · Unit price]",
    artifact: "| SKU | Pack size | Price (USD) |\n|-----|-----------|-------------|\n| A | 12 units | $18.00 |\n| B | 24 units | $30.00 |",
    question: "Which SKU has the lower cost per unit?",
    options: ["SKU A ($1.50/unit)", "SKU B ($1.25/unit)", "Same cost", "Cannot determine"],
    correct: 1,
  },
  {
    tag: "[Numeracy · Overtime]",
    artifact: "> **Pay rules:** Regular 40 hrs/week at $22/hr; overtime over 40 paid at 1.5×. Week total: 46 hours.",
    question: "Calculate gross pay for the week (USD).",
    rubric: "40×22 + 6×33 = 880 + 198 = 1078. Accept $1,078 or 1078.",
    exact: "$1,078",
  },
  {
    tag: "[Numeracy · Tax estimate]",
    artifact: "> **Invoice:** Subtotal $250.00; sales tax 8.25% on subtotal only.",
    question: "Total due including tax?",
    options: ["$270.63", "$268.25", "$258.25", "$272.50"],
    correct: 0,
  },
  {
    tag: "[Numeracy · Budget remainder]",
    artifact: "> **Project budget:** $12,000 USD. Spent to date: $7,450. Pending PO: $2,100.",
    question: "Remaining budget after pending PO clears?",
    options: ["$4,550", "$2,450", "$4,450", "$2,550"],
    correct: 1,
  },
  {
    tag: "[Numeracy · Change due]",
    artifact: "> **Cash sale:** Total $47.35. Customer pays with $60.00.",
    question: "Correct change?",
    options: ["$12.65", "$13.65", "$12.75", "$11.65"],
    correct: 0,
  },
  {
    tag: "[Numeracy · Prorated subscription]",
    artifact: "> **SaaS plan:** $120/month. Upgrade mid-month on day 16 of 30-day period; charge prorated half-month difference of $40.",
    question: "Explain why the upgrade charge is $40 (not the full monthly delta).",
    rubric: "Must reference mid-month/prorated half-period charge per scenario ($40 stated prorated difference).",
    exact: "Prorated half-month upgrade difference of $40.",
    resistance: "high",
  },
  {
    tag: "[Numeracy · Bulk order]",
    artifact: "| Tier | Min qty | Unit (USD) |\n|------|---------|------------|\n| 1 | 1–49 | 8.00 |\n| 2 | 50–199 | 7.25 |\n| 3 | 200+ | 6.50 |\n\nOrder qty: 180",
    question: "Line total for 180 units?",
    options: ["$1,305.00", "$1,440.00", "$1,170.00", "$1,350.00"],
    correct: 0,
  },
  {
    tag: "[Numeracy · Weighted average]",
    artifact: "| Shipment | Units | Freight (USD) |\n|----------|-------|---------------|\n| A | 100 | 400 |\n| B | 50 | 300 |",
    question: "Average freight cost per unit across both shipments?",
    options: ["$4.67", "$5.00", "$4.00", "$3.50"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Deposit balance]",
    artifact: "> **Quote:** Total $3,200. Deposit 30% due at signing; remainder due on delivery.",
    question: "Balance due on delivery?",
    options: ["$2,240", "$960", "$2,140", "$2,340"],
    correct: 0,
  },
  {
    tag: "[Numeracy · Multi-step receipt]",
    artifact: "> **Restaurant:** Food $64.00; 10% service charge auto-added; 8% tax on food+service; you add $5 cash tip on top of total.",
    question: "Explain order of additions and approximate final out-of-pocket before cash tip.",
    rubric: "Service on food → tax on subtotal incl service → then optional tip on top. Approx total before $5 tip: 64 + 6.4 = 70.4; tax 5.63 → ~76.03. Credit for correct sequence even if rounding differs slightly.",
    exact: null,
  },
  {
    tag: "[Numeracy · Hourly contractor]",
    artifact: "> **Contract:** 32 billable hours approved at $85/hr; 10% agency fee deducted from gross.",
    question: "Net payment to contractor?",
    options: ["$2,720", "$2,448", "$2,528", "$2,720 after fee $2,448"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Inventory reorder]",
    artifact: "> **On hand:** 85 units. **Weekly usage:** 40. **Lead time:** 2 weeks. **Safety stock:** 20.",
    question: "Minimum reorder quantity to avoid stockout during lead time?",
    options: ["80", "95", "100", "120"],
    correct: 1,
  },
  {
    tag: "[Numeracy · Split invoice]",
    artifact: "> **Shared vendor bill $1,500:** Team A 60%, Team B 25%, Team C remainder.",
    question: "Team C share (USD)?",
    options: ["$225", "$375", "$150", "$900"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Currency fee]",
    artifact: "> **Wire received:** €1,000. Bank converts at 1.08 USD/EUR with $15 flat fee.",
    question: "USD credited after fee?",
    rubric: "1000×1.08 − 15 = 1065. Accept $1,065.",
    exact: "$1,065",
  },
  {
    tag: "[Numeracy · Break-even units]",
    artifact: "> **Fixed costs:** $5,000/month. **Price/unit:** $50. **Variable cost/unit:** $30.",
    question: "Units to break even?",
    options: ["100", "250", "200", "167"],
    correct: 1,
  },
  {
    tag: "[Numeracy · Tiered discount stack]",
    artifact: "> List $400. Member 10% off list, then coupon $25 off discounted price.",
    question: "Show the calculation steps for the final price (USD).",
    rubric: "10% off 400 = 360; minus $25 coupon = $335. Must show both steps or equivalent.",
    exact: "$335",
  },
  {
    tag: "[Numeracy · Payroll deduction]",
    artifact: "> **Gross:** $3,000. **401k:** 6% pre-tax. **Medical:** $120 flat post-tax.",
    question: "Approximate net if no other deductions (ignore taxes)?",
    options: ["$2,700", "$2,820", "$2,880", "$2,760"],
    correct: 1,
  },
  {
    tag: "[Numeracy · Production yield]",
    artifact: "> **Batch input:** 500 kg. **Expected yield:** 92%. **Actual output:** 448 kg.",
    question: "How many kg short of expected yield?",
    options: ["12 kg", "10 kg", "52 kg", "2 kg"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Rent split]",
    artifact: "> **Office rent $6,000/mo.** Desks: Team X 12, Team Y 8, Team Z 5. Split proportional to desks.",
    question: "Team X monthly share?",
    options: ["$2,742.86", "$2,400", "$3,000", "$2,571.43"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Late fee]",
    artifact: "> **Invoice $2,000 due Jun 1.** Terms: 1.5% monthly late fee on unpaid balance after 30 days. Paid Jul 15 full balance.",
    question: "Late fee owed (one month applied)?",
    options: ["$30", "$0", "$45", "$20"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Trip budget]",
    artifact: "> **Per diem:** $75/day × 4 days. **Flights:** $420. **Ground:** $180. **Buffer:** 10% of subtotal.",
    question: "Total budget including buffer (USD)?",
    rubric: "Subtotal 75×4 + 420 + 180 = 780; buffer 78 → 858. Accept $858.",
    exact: "$858",
  },
  {
    tag: "[Numeracy · Blended rate]",
    artifact: "| Worker | Hours | Rate (USD/hr) |\n|--------|-------|---------------|\n| Alex | 30 | 40 |\n| Sam | 10 | 55 |",
    question: "Blended hourly rate for the combined 40 hours?",
    options: ["$43.75", "$45.00", "$47.50", "$42.50"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Stocktake value]",
    artifact: "| SKU | Qty | Unit cost (USD) |\n|-----|-----|-----------------|\n| P1 | 40 | 12.50 |\n| P2 | 15 | 28.00 |\n| P3 | 0 | 9.00 |",
    question: "Total inventory value on hand?",
    options: ["$920", "$1,010", "$920.00 with P3 excluded", "$920 — P3 adds $0"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Commission]",
    artifact: "> **Sales:** $48,000. **Base:** $2,000. **Commission:** 3% on sales above $20,000 threshold.",
    question: "Total compensation?",
    options: ["$3,840", "$2,840", "$3,440", "$4,440"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numeracy · Multi-receipt reconcile]",
    artifact: "| Receipt | Amount (USD) | Category cap $200 |\n|---------|--------------|-------------------|\n| R1 | 89.50 | Office |\n| R2 | 76.25 | Office |\n| R3 | 45.00 | Office |",
    question: "Total office spend and is it under the $200 team cap?",
    options: [
      "$210.75 — over cap",
      "$210.75 — under cap",
      "$200.75 — over cap",
      "$211.75 — over cap",
    ],
    correct: 0,
    resistance: "high",
  },
]

const NUMERICAL_REASONING = [
  {
    tag: "[Numerical · KPI table]",
    artifact: "| Month | MRR (USD) | New logos |\n|-------|-----------|----------|\n| Apr | 120,000 | 8 |\n| May | 126,000 | 10 |\n| Jun | 131,000 | 9 |",
    question: "Which month had the highest average MRR per new logo?",
    options: ["April ($15,000)", "May ($12,600)", "June (~$14,556)", "All equal"],
    correct: 0,
  },
  {
    tag: "[Numerical · Bar chart description]",
    artifact: "> **Support tickets by channel (Q2)**\n> Email: 420 (↑12% QoQ)\n> Chat: 310 (↓5% QoQ)\n> Phone: 190 (flat QoQ)\n> **Total Q2:** 920",
    question: "Which channel grew as a share of total tickets QoQ if Q1 total was 880?",
    options: ["Email only", "Chat only", "Phone only", "Email and phone"],
    correct: 0,
  },
  {
    tag: "[Numerical · Variance report]",
    artifact: "| Line | Budget | Actual | Var % |\n|------|--------|--------|-------|\n| Travel | 50,000 | 58,000 | +16% |\n| Software | 80,000 | 76,000 | -5% |",
    question: "Which line is over budget in absolute dollars and by how much?",
    rubric: "Travel over by $8,000. Must name Travel and dollar variance (accept 8000 or $8,000).",
    exact: "Travel, $8,000 over",
  },
  {
    tag: "[Numerical · Conversion funnel]",
    artifact: "| Stage | Count |\n|-------|-------|\n| Visits | 10,000 |\n| Signups | 1,200 |\n| Paid | 240 |",
    question: "Signup-to-paid conversion rate?",
    options: ["20%", "2.4%", "12%", "24%"],
    correct: 0,
  },
  {
    tag: "[Numerical · SLA chart]",
    artifact: "> **Uptime by region (Jun)**\n> us-east: 99.92%\n> eu-west: 99.88%\n> ap-south: 99.95%\n> **Target:** 99.90%",
    question: "Which region missed the target?",
    options: ["us-east", "eu-west", "ap-south", "None"],
    correct: 1,
  },
  {
    tag: "[Numerical · Headcount plan]",
    artifact: "| Dept | Jan FTE | Jun FTE | Plan Jun |\n|------|---------|---------|----------|\n| Sales | 20 | 24 | 22 |\n| Eng | 40 | 43 | 45 |",
    question: "Which department is ahead of plan in June?",
    options: ["Sales", "Engineering", "Both", "Neither"],
    correct: 0,
  },
  {
    tag: "[Numerical · Inventory turns]",
    artifact: "> **COGS (quarter):** $600,000. **Average inventory:** $150,000.",
    question: "Inventory turns for the quarter?",
    rubric: "600/150 = 4 turns. Accept 4 or 4.0.",
    exact: "4",
  },
  {
    tag: "[Numerical · NPS table]",
    artifact: "| Wave | Promoters | Passives | Detractors | n |\n|------|-----------|----------|------------|---|\n| W1 | 50 | 30 | 20 | 100 |\n| W2 | 45 | 35 | 20 | 100 |",
    question: "Which wave has higher NPS? (NPS = %promoters − %detractors)",
    options: ["W1 (30)", "W2 (25)", "Tie", "Cannot compute"],
    correct: 0,
  },
  {
    tag: "[Numerical · Pipeline weighted]",
    artifact: "| Deal | Amount (USD) | Stage weight |\n|------|--------------|--------------|\n| A | 100,000 | 50% |\n| B | 50,000 | 80% |\n| C | 20,000 | 20% |",
    question: "Weighted pipeline total?",
    options: ["$114,000", "$170,000", "$90,000", "$104,000"],
    correct: 0,
  },
  {
    tag: "[Numerical · CAC payback]",
    artifact: "> **CAC:** $1,200. **Gross margin/month/customer:** $150.",
    question: "Months to pay back CAC (ignore churn)?",
    options: ["8", "10", "12", "6"],
    correct: 0,
  },
  {
    tag: "[Numerical · YoY growth]",
    artifact: "| Metric | 2025 | 2026 |\n|--------|------|------|\n| Revenue | 4.0M | 4.6M |\n| Customers | 800 | 920 |",
    question: "Which metric grew faster in percentage terms and by approximately how much?",
    rubric: "Customers +15% (120/800) vs revenue +15% (0.6/4.0) — tie at 15% OR must show both calculations; accept either metric if math shown correctly.",
    exact: "Both grew ~15%; customers slightly higher if rounding 920/800=15%",
    resistance: "high",
  },
  {
    tag: "[Numerical · Utilization]",
    artifact: "> **Consultant week:** 32 billable hours logged; 40 hours available; 4 hours PTO same week.",
    question: "Utilization vs available client hours (exclude PTO)?",
    options: ["80%", "88.9%", "94.1%", "75%"],
    correct: 1,
  },
  {
    tag: "[Numerical · Mix shift]",
    artifact: "| Product | Q1 share | Q2 share | Q2 revenue |\n|---------|----------|----------|------------|\n| Basic | 60% | 50% | $500k total |",
    question: "If total revenue flat QoQ, what happened to Basic revenue dollars?",
    options: ["Increased", "Decreased", "Unchanged", "Unknown"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Numerical · Error rate trend]",
    artifact: "| Week | Jobs | Errors |\n|------|------|--------|\n| 1 | 10,000 | 50 |\n| 2 | 12,000 | 48 |\n| 3 | 11,000 | 44 |",
    question: "Which week has the lowest error rate?",
    options: ["Week 1 (0.50%)", "Week 2 (0.40%)", "Week 3 (0.40%)", "Weeks 2 and 3 tie lowest"],
    correct: 3,
  },
  {
    tag: "[Numerical · Budget reforecast]",
    artifact: "> **H1 spend:** $450k of $500k H1 budget. **H2 budget:** $550k. **Guidance:** hold full-year at $1.02M.",
    question: "Implied H2 spend cap if H1 trend continues?",
    rubric: "Full year 1.02M − 450k H1 spend = 570k remaining for H2 OR compare to 550k budget — must show 570k available vs 550k planned. Credit clear numeric reasoning.",
    exact: null,
  },
  {
    tag: "[Numerical · Cohort retention]",
    artifact: "| Month | Cohort size | Active |\n|-------|-------------|--------|\n| M0 | 1,000 | 1,000 |\n| M3 | 1,000 | 620 |",
    question: "M3 retention rate?",
    options: ["62%", "38%", "68%", "59%"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numerical · Capacity plan]",
    artifact: "> **Server capacity:** 8,000 rps max. **Peak observed:** 6,200 rps. **Growth:** +10% expected next quarter.",
    question: "Headroom after growth at current peak?",
    options: ["About 13% before max", "About 22% before max", "Over capacity", "Exactly at max"],
    correct: 0,
  },
  {
    tag: "[Numerical · Margin bridge]",
    artifact: "| Driver | bps impact |\n|--------|------------|\n| Price | +120 |\n| COGS | -80 |\n| Mix | -40 |\n| **Net** | **0** |",
    question: "Net margin change in percentage points?",
    options: ["+0.0 pp", "+0.4 pp", "-0.4 pp", "+1.2 pp"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numerical · Forecast accuracy]",
    artifact: "| SKU | Forecast | Actual | APE |\n|-----|----------|--------|-----|\n| X | 1,000 | 900 | 10% |\n| Y | 500 | 550 | 10% |",
    question: "Which SKU had absolute percent error of 10%?",
    rubric: "Both X and Y — accept 'both' or list both SKUs.",
    exact: "Both SKU X and SKU Y",
  },
  {
    tag: "[Numerical · Market share]",
    artifact: "> **Market size:** $200M. **Our revenue:** $26M. **Competitor A:** $30M.",
    question: "Our share vs Competitor A?",
    options: ["13% vs 15%", "15% vs 13%", "26% vs 30%", "12% vs 14%"],
    correct: 0,
  },
  {
    tag: "[Numerical · Labor cost ratio]",
    artifact: "| Quarter | Revenue | Payroll |\n|---------|---------|--------|\n| Q1 | 2.0M | 800k |\n| Q2 | 2.4M | 900k |",
    question: "Which quarter has higher payroll as % of revenue?",
    options: ["Q1 (40%)", "Q2 (37.5%)", "Equal", "Q2 higher"],
    correct: 0,
  },
  {
    tag: "[Numerical · Scenario compare]",
    artifact: "> **Scenario A:** +5% volume, -2% price.\n> **Scenario B:** flat volume, +3% price.\n> **Base revenue index:** 100",
    question: "Compute the revenue index for Scenario A and B; which is higher?",
    rubric: "A: 1.05×0.98≈1.029 (102.9); B: 1.03 (103). B higher. Credit for method even if minor rounding difference.",
    exact: "Scenario B (~103 vs ~102.9)",
  },
  {
    tag: "[Numerical · Multi-metric dashboard]",
    artifact: "| KPI | Target | Actual | Status |\n|-----|--------|--------|--------|\n| Churn | ≤2.0% | 2.3% | Red |\n| NRR | ≥110% | 112% | Green |\n| CAC | ≤$900 | $880 | Green |",
    question: "How many KPIs missed target?",
    options: ["0", "1", "2", "3"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Numerical · Seasonality adjust]",
    artifact: "> **Retail index:** Jul baseline 1.00; Dec seasonal factor 1.35. **Jul sales:** $400k.",
    question: "Seasonally adjusted expectation for Dec if trend flat?",
    options: ["$540k", "$400k", "$435k", "$500k"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numerical · Breakeven sensitivity]",
    artifact: "> **Fixed costs ↑10%.** Price and variable cost unchanged. **Old breakeven:** 200 units.",
    question: "Directional effect on breakeven volume?",
    options: ["Increases", "Decreases", "Unchanged", "Doubles"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numerical · Portfolio variance]",
    artifact: "| Segment | Budget var | Actual var |\n|---------|------------|------------|\n| A | +5% | +8% |\n| B | -3% | -1% |",
    question: "Which segment exceeded favorable budget variance?",
    rubric: "Segment B beat budget (spent less unfavorably than budgeted). Must interpret variance direction correctly.",
    exact: "Segment B — spent less unfavorably than budgeted",
  },
  {
    tag: "[Numerical · Throughput]",
    artifact: "> **Line 1:** 120 units/hr. **Line 2:** 95 units/hr. **Demand:** 200 units/hr.",
    question: "Minimum combined capacity gap vs demand?",
    options: ["15 units/hr short", "25 units/hr short", "Surplus 15", "Surplus 25"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numerical · Rule of 40]",
    artifact: "> **SaaS metrics:** Revenue growth 28%; EBITDA margin 14%.",
    question: "Rule of 40 score and pass/fail if threshold is 40?",
    options: ["42 — pass", "14 — fail", "28 — fail", "40 — pass"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numerical · Waterfall]",
    artifact: "> **MRR walk:** Start $100k; +New $15k; -Churn $8k; +Expansion $5k; End $?",
    question: "Ending MRR?",
    options: ["$112k", "$107k", "$120k", "$110k"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Numerical · Composite index]",
    artifact: "| Factor | Weight | Score |\n|--------|--------|-------|\n| Quality | 40% | 85 |\n| Speed | 35% | 90 |\n| Cost | 25% | 80 |",
    question: "Weighted composite score?",
    options: ["86.25", "85.00", "87.50", "84.75"],
    correct: 0,
    resistance: "high",
  },
]

const CRITICAL_THINKING = [
  {
    tag: "[Critical · Memo claim]",
    artifact: "> **Ops memo:** \"Deploy failures dropped 40% after we added more engineers — hiring fixed reliability.\"",
    question: "What alternative explanation should you consider before accepting the claim?",
    options: [
      "Engineers cause failures",
      "Concurrent tooling/process changes or lower deploy frequency may explain the drop",
      "40% is too small to matter",
      "Hiring always improves reliability",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Survey snippet]",
    artifact: "> **Pulse survey:** 92% of respondents satisfied with IT support. **n=25** from a voluntary Slack poll.",
    question: "Biggest limitation when generalizing to all employees?",
    options: ["Sample size only", "Voluntary response bias and small n", "Satisfaction cannot be measured", "Slack users are always satisfied"],
    correct: 1,
  },
  {
    tag: "[Critical · Vendor pitch]",
    artifact: "> **Vendor slide:** \"Customers using our tool ship 2× faster.\" Footnote: study sponsored by vendor; n=12; no control group.",
    question: "Strongest critique of the evidence?",
    rubric: "Must cite sponsored small sample and lack of control/causation — correlation not causation. Credit for both bias and methodology.",
    exact: null,
  },
  {
    tag: "[Critical · RCA email]",
    artifact: "> **Postmortem:** \"Root cause: human error. Action: retrain engineer.\" Timeline shows automated rollback failed due to missing permission.",
    question: "What gap exists in this root-cause analysis?",
    options: [
      "Human error is never valid",
      "Systemic control failure (rollback permissions) not addressed",
      "Retraining is always wrong",
      "Timeline irrelevant",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Metric choice]",
    artifact: "> **Proposal:** Measure support success solely by average handle time (AHT) reduction.",
    question: "Primary risk of optimizing only AHT?",
    options: [
      "AHT is hard to measure",
      "Quality/satisfaction may worsen if agents rush cases",
      "AHT always improves revenue",
      "Customers prefer faster tickets regardless of outcome",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · News summary]",
    artifact: "> **Competitor blog:** \"We grew users 300% YoY.\" No absolute numbers; base year was a private beta with 50 users.",
    question: "Why might 300% be misleading externally?",
    options: [
      "Percent growth always lies",
      "Small base makes percentage look dramatic without scale context",
      "YoY invalid for startups",
      "300% is below market",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Policy debate]",
    artifact: "> **Debate:** \"Mandatory return-to-office improves collaboration because hallway conversations increase.\"",
    question: "What evidence would most fairly test the claim?",
    rubric: "Needs comparable teams/cohorts, collaboration metrics (not anecdotes), control for hybrid/remote baselines, time period. Credit for experimental or quasi-experimental thinking.",
    exact: null,
  },
  {
    tag: "[Critical · Data table]",
    artifact: "| Region | Revenue ↑ | Churn ↑ |\n|--------|-----------|--------|\n| A | Yes | Yes |\n| B | Yes | No |\n| C | No | Yes |",
    question: "Can you conclude high churn causes revenue growth from this table?",
    options: ["Yes, Region A proves it", "No — correlation across three regions insufficient", "Yes, if C confirms", "Only with more regions"],
    correct: 1,
  },
  {
    tag: "[Critical · Assumption audit]",
    artifact: "> **Forecast memo assumes:** \"Marketing spend ↑10% → leads ↑10% linearly; conversion constant.\"",
    question: "Which assumption is most fragile in a saturated channel?",
    options: ["Conversion constant", "Linear lead response to spend", "Both are fragile", "Neither — forecasts are exact"],
    correct: 2,
  },
  {
    tag: "[Critical · Legal vs ops]",
    artifact: "> **Legal:** \"Do not store data in Region X.\" **Ops ticket:** \"Copy backups to Region X for latency.\"",
    question: "Best immediate interpretation?",
    options: [
      "Ops should proceed if latency improves",
      "Legal constraint overrides latency optimization pending exception process",
      "Backups are exempt",
      "Latency trumps compliance",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Causal diagram]",
    artifact: "> **Claim:** \"NPS rose after we shipped Feature Z, so Feature Z caused loyalty gains.\" Feature Z rolled out same week as major outage fix.",
    question: "What confound should be ruled out before attributing NPS change to Feature Z?",
    rubric: "Must cite concurrent outage fix (or other simultaneous change) as alternative explanation for NPS move.",
    exact: "Major outage fix the same week may explain NPS improvement.",
    resistance: "high",
  },
  {
    tag: "[Critical · Selection bias]",
    artifact: "> **Case study:** \"Top 5 customers who adopted AI assistant increased output 30%.\"",
    question: "Flaw in using this to justify company-wide rollout?",
    options: [
      "30% too low",
      "Cherry-picked success cases ignore non-adopters/failures",
      "AI always helps",
      "Customers invalid sample",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Base rate]",
    artifact: "> **Security alert:** 99% accurate test; 1% of login attempts are attacks; alert fires.",
    question: "Why might most alerts still be false positives?",
    options: [
      "Tests cannot be accurate",
      "Low base rate of attacks means true positives are rare vs benign traffic",
      "99% accuracy eliminates false positives",
      "Alerts always correct",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Critical · Stakeholder memo]",
    artifact: "> **PM memo:** \"Competitor lacks Feature X; therefore we will win enterprise deals.\" Win/loss cites price and integration depth more often.",
    question: "What should decision-makers ask next?",
    options: [
      "Copy competitor pricing only",
      "Validate win/loss drivers before betting strategy on Feature X alone",
      "Ignore win/loss data",
      "Remove Feature X",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Evidence hierarchy]",
    artifact: "> **Sources:** (A) Randomized A/B on checkout, n=50k; (B) CEO anecdote; (C) Social media thread.",
    question: "Which source should weigh most for a pricing change?",
    rubric: "A — randomized A/B at scale. Must rank A above anecdote/social and note why (sample, methodology).",
    exact: "Source A — randomized A/B with large n",
  },
  {
    tag: "[Critical · Survivorship]",
    artifact: "> **Blog:** \"Studied unicorn founders — 80% dropped out of college.\" Dropouts who failed not interviewed.",
    question: "Logical fallacy?",
    options: ["Survivorship bias", "Straw man", "Ad hominem", "No fallacy"],
    correct: 0,
    resistance: "high",
  },
  {
    tag: "[Critical · Proxy metric]",
    artifact: "> **Engagement team tracks:** Daily active clicks on settings page as \"engagement.\"",
    question: "Why is this a weak proxy for product value?",
    options: [
      "Clicks are impossible to count",
      "Settings clicks may reflect confusion or mandatory tasks, not value",
      "DAU always equals value",
      "Settings page unused",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · False dichotomy]",
    artifact: "> **Exec slide:** \"Either we cut QA headcount 30% or we miss the launch date.\"",
    question: "Best response in a decision meeting?",
    options: [
      "Accept the dichotomy",
      "Surface scope/timeline trade-offs and phased quality strategies beyond binary cut",
      "Always cut QA",
      "Delay launch indefinitely",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Critical · Analogical risk]",
    artifact: "> **Argument:** \"Company Y moved to four-day week with no productivity loss; we should too.\" Company Y is 40-person creative agency; you are 24/7 logistics software.",
    question: "Core weakness in the analogy?",
    rubric: "Different operating model/customer SLA/context — analogy may not transfer. Must mention operational or business model mismatch.",
    exact: null,
  },
  {
    tag: "[Critical · Incentive design]",
    artifact: "> **Sales comp change:** 100% commission on bookings; no clawback for churn within 90 days.",
    question: "Likely unintended behavior?",
    options: [
      "Slower closing",
      "Pushing low-fit deals to maximize bookings",
      "Improved customer success",
      "Lower churn automatically",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Trend extrapolation]",
    artifact: "> **Board slide:** \"MRR grew 5% MoM for 3 months; therefore 60% annual growth locked.\"",
    question: "Identify two reasons this extrapolation may be unreliable.",
    rubric: "Should mention compounding vs simple annualization error and/or churn, saturation, seasonality, small sample window. At least two distinct issues.",
    exact: null,
  },
  {
    tag: "[Critical · Conflicting studies]",
    artifact: "> Study 1 (2024): remote ↓ productivity 8%. Study 2 (2025): remote = parity. Study 1 measures factory shifts; Study 2 measures software teams.",
    question: "How should a software COO use these?",
    options: [
      "Pick Study 1 because older",
      "Apply Study 2 context but run own measurement — populations differ",
      "Average the percentages",
      "Ignore both",
    ],
    correct: 1,
  },
  {
    tag: "[Critical · Risk framing]",
    artifact: "> **Security vendor:** \"Without our tool, you face catastrophic breach.\" No data on your environment.",
    question: "Best critical response?",
    options: [
      "Buy immediately",
      "Request risk assessment tied to your assets/threat model, not generic catastrophe framing",
      "Ignore security",
      "Assume breach is certain",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Critical · Counterfactual]",
    artifact: "> **Claim:** \"Price cut increased units 20%, so revenue must be up.\" Price reduced 15%.",
    question: "Revenue direction vs prior?",
    options: ["Up for sure", "Down or flat possible — volume gain may not offset price cut", "Unchanged always", "Cannot compute"],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Critical · Hidden cost]",
    artifact: "> **Build vs buy:** Buy saves $200k license vs $350k build. Build estimate excludes 2 FTE maintenance.",
    question: "Decision flaw?",
    options: [
      "License always cheaper",
      "Ongoing maintenance FTE cost omitted from build comparison",
      "Build always better",
      "FTE cost irrelevant",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Critical · Narrative fallacy]",
    artifact: "> **Investor story:** \"We failed in Market A because of timing, succeeded in B because of vision.\" Same product-market misfit signals in both.",
    question: "How should an internal reviewer respond?",
    rubric: "Challenge post-hoc narrative; examine consistent PMF evidence vs storytelling. Credit for separating outcome bias from data.",
    exact: null,
    seniority: "senior",
  },
  {
    tag: "[Critical · Multi-stakeholder]",
    artifact: "> **Proposal:** Use chatbot for all Tier 1 support to cut costs 40%. CS lead cites CSAT drop in pilot; CFO cites cost target.",
    question: "What decision framework best resolves the conflict?",
    options: [
      "CFO wins on cost",
      "Evaluate total cost including churn/escalations and segment-specific rollout",
      "CSAT irrelevant",
      "Cancel pilot data",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
  {
    tag: "[Critical · Ethics vs KPI]",
    artifact: "> **Growth experiment:** Default opt-in newsletter to inflate list 25%; legal says CAN-SPAM requires clear consent.",
    question: "Appropriate course?",
    options: [
      "Proceed — KPI matters",
      "Reject or redesign to explicit opt-in despite lower list growth",
      "Hide opt-out link",
      "Only test in EU",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
  {
    tag: "[Critical · Model limits]",
    artifact: "> **Forecast model:** Uses last 12 months only; COVID-era spike included; predicts 18-month demand.",
    question: "Two limitations to flag before trusting output?",
    options: [
      "None — 12 months is perfect",
      "Anomaly period may distort; horizon exceeds reliable trend",
      "Model color wrong",
      "Excel version outdated",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
  {
    tag: "[Critical · Strategic tradeoff]",
    artifact: "> **Strategy memo:** Enter Region R for TAM, but payments compliance cost $2M/yr and sales cycle 2× domestic.",
    question: "What analysis is missing before go/no-go?",
    options: [
      "Logo color in Region R",
      "Unit economics and payback vs $2M fixed compliance given longer cycles",
      "Only TAM size",
      "Competitor count only",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
]

const PROBLEM_SOLVING = [
  {
    tag: "[Problem · Scheduling conflict]",
    artifact: "> **Context:** Two critical meetings overlap — client QBR (mandatory you) and internal launch go/no-go (you are optional backup). Client prep unfinished.",
    question: "First step to resolve?",
    options: [
      "Cancel client QBR",
      "Clarify stakes/delegates for go/no-go; prioritize client prep with assigned backup",
      "Attend both partially",
      "Ignore internal meeting",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Missing data]",
    artifact: "> **Ticket:** \"Reports wrong for Acme.\" Export shows blank for Acme only; other tenants fine.",
    question: "Most efficient next diagnostic step?",
    options: [
      "Rebuild entire warehouse",
      "Check tenant filter/permissions and recent config change for Acme",
      "Blame user error",
      "Disable Acme account",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Resource constraint]",
    artifact: "> **Situation:** Three P1 bugs, one engineer for 4 hours before release freeze.",
    question: "How should you prioritize?",
    rubric: "Must mention impact/customer exposure/risk or reproducibility — structured triage, not random. Credit explicit criteria.",
    exact: null,
  },
  {
    tag: "[Problem · Vendor delay]",
    artifact: "> **Update:** Critical chip shipment delayed 3 weeks. Assembly line idle cost $40k/week. Partial alternate part exists with 5% yield hit.",
    question: "Immediate decision framework?",
    options: [
      "Wait always",
      "Compare idle cost vs yield/rework cost of alternate; possibly split production",
      "Cancel product",
      "Ship without chip",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Customer escalation]",
    artifact: "> **Email chain:** Enterprise customer threatens churn over repeated invoice errors; finance says amounts correct; customer cites PO mismatch.",
    question: "Best first cross-functional move?",
    options: [
      "Offer discount without investigation",
      "Reconcile PO, contract, and invoice line items with finance + CS on call",
      "Ignore until legal",
      "Close ticket",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Ambiguous request]",
    artifact: "> **Slack:** \"Make the dashboard faster ASAP.\" No metrics or page specified.",
    question: "What do you do first?",
    options: [
      "Rewrite entire frontend",
      "Define page, baseline metrics, and target SLA with requester",
      "Add caching everywhere",
      "Buy bigger servers",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Partial outage]",
    artifact: "> **Status:** API 500s for 5% of requests; only users with legacy auth profile; deploy 2 hours ago touched auth middleware.",
    question: "Mitigation priority?",
    rubric: "Rollback/canary/feature flag for auth change or targeted fix; preserve evidence. Must not jump to unrelated fixes.",
    exact: "Rollback or disable recent auth middleware change while investigating legacy profile edge case.",
  },
  {
    tag: "[Problem · Training gap]",
    artifact: "> **Observation:** New hires fail expense policy quiz; errors cluster on international receipts.",
    question: "Targeted improvement?",
    options: [
      "Retrain all policies equally",
      "Add international receipt examples and checklist to onboarding",
      "Eliminate expenses",
      "Fail all new hires",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Scope creep]",
    artifact: "> **SOW:** 4-week migration. Week 2: stakeholder adds real-time sync \"small ask.\"",
    question: "Professional response?",
    options: [
      "Absorb silently",
      "Document impact on timeline/cost; change control before committing",
      "Stop migration",
      "Add headcount without telling client",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Data quality]",
    artifact: "> **Pipeline alert:** Row count +30% day-over-day; downstream dashboards doubled conversions.",
    question: "First hypothesis to test?",
    options: [
      "Marketing truly doubled conversions",
      "Duplicate ingest or join fan-out in pipeline",
      "Dashboard bug only",
      "Ignore spike",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Capacity crunch]",
    artifact: "> **Support queue:** 400 open tickets; staffing 8 agents; SLA breaching on P2s.",
    question: "Outline a 24-hour relief plan with at least three concrete actions.",
    rubric: "Must include priority triage plus at least two of: macros/templates, surge staff, root-cause on top driver, exec comms on SLA risk. Actions should be ordered/practical.",
    exact: null,
    resistance: "high",
  },
  {
    tag: "[Problem · Compliance deadline]",
    artifact: "> **Regulation effective in 60 days.** Gap analysis shows 12 controls missing; 3 need vendor.",
    question: "Planning approach?",
    options: [
      "Fix all 12 sequentially",
      "Critical-path vendor items first; parallelize internal controls; milestone reviews",
      "Wait for extension",
      "Hide gaps",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Cross-timezone handoff]",
    artifact: "> **Incident at 18:00 PT.** EU team starting; US team exhausted; customer in APAC waiting.",
    question: "Handoff must include?",
    options: [
      "Only \"still broken\"",
      "Current impact, hypotheses tried, next steps, comms sent, owner",
      "Blame assignment",
      "Close incident",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Problem · Budget overrun]",
    artifact: "> **Project at 85% spend, 60% complete.** Two workstreams: integration (on track), customization (over).",
    question: "Recovery option set?",
    options: [
      "Spend remaining budget faster",
      "Re-scope customization, reallocate to integration critical path, escalate trade-offs",
      "Ignore customization",
      "Double budget silently",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Tool failure mid-process]",
    artifact: "> **Payroll run:** Tax filing API down 6 hours before deadline; partial batch submitted.",
    question: "Actions in order?",
    rubric: "Communicate status, manual fallback/contingency if available, document partial submission, meet deadline or file extension — ordered thinking required.",
    exact: null,
  },
  {
    tag: "[Problem · Conflicting priorities]",
    artifact: "> **CEO wants demo Friday.** **Security audit finding must fix credential leak before any external demo.**",
    question: "Best path?",
    options: [
      "Demo anyway",
      "Fix leak first; demo sanitized environment or delay with transparent comms",
      "Hide leak",
      "Cancel product",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Problem · Warehouse mismatch]",
    artifact: "> **Pick rate dropped 18%.** Recent WMS update; pickers report screen lag; inventory accuracy 98%.",
    question: "Where to investigate first?",
    options: [
      "Fire pickers",
      "Profile WMS UI latency and update rollback vs hardware",
      "Order more stock",
      "Change SKU labels",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Partner dependency]",
    artifact: "> **API partner deprecates endpoint in 90 days.** Your usage is 40% of customer workflows; replacement needs schema mapping.",
    question: "90-day plan outline?",
    options: [
      "Wait until day 89",
      "Inventory callers, build adapter, staged migration, customer comms timeline",
      "Fork partner API",
      "Turn off feature",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Problem · Quality defect spike]",
    artifact: "> **Returns ↑ on SKU-441 after supplier change.** Defect photos show cracked housing; lot trace points to weeks 28–29.",
    question: "Containment step?",
    rubric: "Quarantine affected lots, stop shipment, notify supplier, inspect WIP — must mention lot trace/containment before root cause.",
    exact: "Quarantine lots from weeks 28–29 and halt outbound shipments pending inspection.",
  },
  {
    tag: "[Problem · Hiring bottleneck]",
    artifact: "> **Open reqs:** 15; time-to-fill 95 days; offer decline rate 40% citing comp.",
    question: "Which lever triage first?",
    options: [
      "More sourcing only",
      "Analyze comp bands vs market on declined offers; parallel process fixes",
      "Lower bar",
      "Stop hiring",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Event planning]",
    artifact: "> **User conference in 8 weeks.** Venue capacity 600; registrations 780; waitlist growing.",
    question: "Options to consider?",
    options: [
      "Ignore overage",
      "Overflow streaming, cap in-person with priority rules, or move venue — communicate early",
      "Cancel conference",
      "Let fire marshal decide day-of",
    ],
    correct: 1,
  },
  {
    tag: "[Problem · Knowledge silo]",
    artifact: "> **Only Alex knows billing reconciliation script; Alex on leave 2 weeks; month-end in 5 days.**",
    question: "What three steps reduce month-end risk before Alex leaves?",
    rubric: "Documentation/shadow run, assign backup owner, dry-run reconciliation; optional freeze non-critical billing changes. Need ordered practical steps.",
    exact: null,
  },
  {
    tag: "[Problem · Multi-vendor outage]",
    artifact: "> **Status page:** CDN degraded + identity provider slow. Login failures spike.",
    question: "Customer comms should?",
    options: [
      "Blame customers",
      "Acknowledge user impact, separate components, provide workaround/status cadence",
      "Stay silent",
      "Share internal passwords",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Problem · Process breakdown]",
    artifact: "> **Change requests bypass CAB 3 times this month; two caused prod incidents.**",
    question: "Systemic fix?",
    options: [
      "Ban all changes",
      "Reinforce CAB with emergency path, audit trail, and manager accountability",
      "Blame on-call",
      "Remove CAB",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Problem · Inventory stockout]",
    artifact: "> **SKU-119 stockout 10 days.** Lead time 14 days; substitute SKU-120 fits 70% use cases with adapter.",
    question: "Short-term customer strategy?",
    options: [
      "Backorder silently",
      "Offer substitute + adapter where compatible; prioritize key accounts; expedite PO",
      "Raise price",
      "Discontinue SKU",
    ],
    correct: 1,
    resistance: "high",
  },
  {
    tag: "[Problem · Strategic ambiguity]",
    artifact: "> **Board asks:** Enter mid-market segment with current enterprise product vs build lighter SKU. Sales capacity fixed 12 months.",
    question: "Outline decision approach (not the answer itself).",
    rubric: "Must structure: market sizing, product fit gap, build/buy/partner, GTM capacity, financial scenarios, risks — senior structured thinking.",
    exact: null,
    seniority: "senior",
  },
  {
    tag: "[Problem · Crisis comms]",
    artifact: "> **Data exposure affecting 200 customers; facts still emerging; press inquiry received.**",
    question: "First 60-minute comms plan elements?",
    options: [
      "Full technical postmortem publicly",
      "Internal war room, legal/privacy, holding statement, customer notification draft, fact timeline",
      "Deny until certain",
      "Tweet details immediately",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
  {
    tag: "[Problem · Platform bet]",
    artifact: "> **Tech choice:** Monolith modularization vs new microservice for payments; team 6 engineers; peak season in 5 months.",
    question: "How should the EM frame the decision?",
    options: [
      "Always microservices",
      "Compare blast radius, season timing, rollback, team skill — possibly defer split until after peak",
      "Rewrite everything",
      "Outsource payments",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
  {
    tag: "[Problem · Org redesign]",
    artifact: "> **Support merging with CS.** Tooling different; SLAs conflict; morale risk.",
    question: "First 30-day focus?",
    options: [
      "Layoffs first",
      "Unified intake taxonomy, SLA map, tooling bridge plan, change champions",
      "Force one tool day one",
      "Ignore SLAs",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
  {
    tag: "[Problem · Incomplete requirements]",
    artifact: "> **Exec request:** \"AI for all support tickets by Q4.\" No success metrics, data privacy review, or budget.",
    question: "What do you deliver before building?",
    options: [
      "Start coding",
      "Problem definition, success metrics, risk/privacy review, phased pilot proposal",
      "Buy first vendor demo",
      "Hire data scientists only",
    ],
    correct: 1,
    resistance: "high",
    seniority: "senior",
  },
]

const BANKS = {
  "reading-comprehension": READING_COMPREHENSION,
  "attention-to-detail": ATTENTION_TO_DETAIL,
  "following-instructions": FOLLOWING_INSTRUCTIONS,
  "applied-numeracy": APPLIED_NUMERACY,
  "numerical-reasoning": NUMERICAL_REASONING,
  "critical-thinking": CRITICAL_THINKING,
  "problem-solving": PROBLEM_SOLVING,
}

function validateFile(categoryId, questions) {
  const errors = []
  if (questions.length !== 30) {
    errors.push(`expected 30 questions, got ${questions.length}`)
  }

  const diff = { easy: 0, medium: 0, hard: 0 }
  let shortCount = 0
  let highCount = 0

  questions.forEach((q, i) => {
    diff[q.difficulty] = (diff[q.difficulty] ?? 0) + 1
    if (q.type === "short_answer") shortCount++
    if (q.ai_resistance === "high") highCount++

    if (q.category_id !== categoryId) errors.push(`#${i} wrong category_id`)
    if (!q.prompt.includes("\n")) errors.push(`#${i} prompt missing artifact block`)
    if (q.estimated_minutes !== 1 && q.estimated_minutes !== 2) {
      errors.push(`#${i} bad estimated_minutes: ${q.estimated_minutes}`)
    }
    if (q.type === "multiple_choice") {
      if (q.options.length !== 4) errors.push(`#${i} MCQ needs 4 options`)
      if (q.correct_option_index == null) errors.push(`#${i} MCQ missing correct index`)
      if (q.rubric) errors.push(`#${i} MCQ should not have rubric`)
    }
    if (q.type === "short_answer") {
      if (!q.rubric?.trim()) errors.push(`#${i} short_answer missing rubric`)
      if (q.options.length) errors.push(`#${i} short_answer has options`)
    }
    const banned = /\b(IQ|GMA|Fluid Intelligence|Intelligence test|Cognitive Ability)\b/i
    if (banned.test(q.prompt)) errors.push(`#${i} banned psychometric term`)
  })

  if (diff.easy !== 10 || diff.medium !== 12 || diff.hard !== 8) {
    errors.push(`difficulty mix ${JSON.stringify(diff)} (want 10/12/8)`)
  }
  if (shortCount !== 7) errors.push(`short_answer count ${shortCount} (want 7)`)
  if (highCount < 12) errors.push(`high ai_resistance ${highCount} (want ≥12)`)

  return { errors, diff, shortCount, highCount }
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const summary = []

  for (const categoryId of CATEGORIES) {
    const specs = BANKS[categoryId]
    if (!specs) throw new Error(`Missing bank: ${categoryId}`)
    const questions = assembleCategory(categoryId, specs)
    const { errors, highCount } = validateFile(categoryId, questions)
    if (errors.length) {
      console.error(`Validation failed for ${categoryId}:`)
      for (const e of errors) console.error(`  - ${e}`)
      process.exit(1)
    }

    const outPath = join(OUT_DIR, `${categoryId}.json`)
    writeFileSync(outPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8")
    summary.push({
      path: outPath,
      count: questions.length,
      highResistance: highCount,
    })
    console.log(`Wrote ${outPath} (${questions.length} questions, ${highCount} high-resistance)`)
  }

  console.log("\n--- Summary ---")
  for (const row of summary) {
    console.log(
      `${row.path}: ${row.count} questions, ${row.highResistance} high-resistance`,
    )
  }
  console.log(`Total: ${summary.reduce((s, r) => s + r.count, 0)} questions`)
}

main()
