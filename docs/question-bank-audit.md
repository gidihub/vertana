# Question-bank screening-readiness audit

_Generated 2026-07-19 · read-only analysis at audit time; remediation applied afterward (see **Post-remediation status** below)._

## Executive summary

### At audit time (historical raw sources)

- **Bank size (raw):** 879 library questions across 17 leaf categories (legacy seed 48 + generated 631 + ML 100 + MBB 100). This count **double-counted** 36 prompts that appeared in both legacy seed and generated JSON for Backend Engineering, Data Analyst, and Customer Support (12 each).
- **Effective unique (pre-DB):** 843 prompts after removing those 36 overlaps.
- **Duplication:** 36 exact-duplicate prompts — Backend, Data Analyst and Customer Support each re-shipped their 12 legacy questions inside `generated/*.json` (see §5).

### Post-remediation status (current sources)

- **Bank size (effective):** **865** unique prompts in source files — 843 after dedupe **plus 22** new AI-Assisted Work Sample questions (`ai-assisted-work-sample.json`).
- **Duplication:** **0** remaining legacy/generated overlaps in source; `apply-generated-library.mjs` skips generated rows that match retained legacy prompts, and `cleanup-duplicate-library-questions.mjs` removes any duplicates already in the database.
- **Schema:** `seniority`, `rubric`, and `model_answer` fields added (migration 044) with editor support and AI grading assist integration.
- **AI-Assisted Work Sample:** populated with **22** rubric-backed questions and bundle `ai-work-sample-quick`.
- **Bundles:** **29** curated bundles (up from 6) covering all leaf categories that had enough content at audit time.

### Screening viability (audit snapshot — counts below are historical raw totals)

- **Screening-viable today (3):** Backend Engineering, Machine Learning, Project & Program Associate.
- **Thin (13)** (usable for one level / small volumes): Frontend Engineering, DevOps & Cloud, QA & Testing, Mobile Engineering, Database Administration, Data Analyst / Data Science, Business & Financial Analysis, Customer & Technical Support, Sales & Growth Marketing, UX & Design, HR & People Management, AI Governance & Responsible Use, Remote Collaboration & Async Communication.
- **Not viable at audit (1)** (content gap, since remediated): AI-Assisted Work Sample — was empty; now has 22 questions.
- **Packaging gaps at audit** (enough questions, no bundle): DevOps & Cloud, QA & Testing, Mobile Engineering, Database Administration, Business & Financial Analysis, Sales & Growth Marketing, UX & Design, HR & People Management, AI Governance & Responsible Use, Remote Collaboration & Async Communication — **bundles added** for these in remediation.
- **Difficulty field:** present on generated questions only — 631/879 raw (71.8%) carry a stored `difficulty`; ML (100), MBB (100) and legacy (48) have **no** difficulty field (difficulty inferred from time + AI-resistance for viability).
- **Seniority field:** **added post-audit** (`seniority` on library questions; ML/MBB backfilled via migration 044). Not present in the original audit schema.
- **Rubrics / model answers:** **added post-audit** (`rubric`, `model_answer` columns + editor fields). At audit time, short-answer questions relied on `correct_answer_exact` (almost always null → manual grading); coding relied on `test_cases`. Those exact-answer and test-case paths remain the primary auto-grade aids; rubric/model answer improve manual and AI-assisted grading where populated.
- **AI-resistance:** every question is tagged (low/medium/high); the gap is *distribution* (low/medium heavy), not missing tags.

## 1. Composition per leaf category

_Historical raw totals at audit time (879 rows, including 36 legacy/generated duplicates). Post-remediation effective counts are 12 lower in Backend, Data Analyst, and Customer Support, and AI-Assisted Work Sample is now 22._

Types shown as counts (MCQ / Short / Coding). AI-resistance as L/M/H. "Stored diff." = share with an explicit `difficulty` field. "SA w/ key" = short-answer questions with an exact-answer key; "Coding w/ tests" = coding questions with test cases.

| Category | Tier | Total | MCQ | Short | Coding | AI-res L/M/H | Stored diff. | SA w/ key | Coding w/ tests | Avg pts | Avg min |
|---|---|--:|--:|--:|--:|---|---|---|---|--:|--:|
| Frontend Engineering | 1 | 84 | 36 | 26 | 22 | 20/41/23 | 72/84 (85.7%) | 23/26 | 19/22 | 2.5 | 6.3 |
| Backend Engineering | 1 | 94 | 40 | 28 | 26 | 13/60/21 | 82/94 (87.2%) | 22/28 | 18/26 | 1.8 | 6.1 |
| DevOps & Cloud | 2 | 42 | 23 | 12 | 7 | 7/26/9 | 42/42 (100%) | 12/12 | 7/7 | 1.8 | 5.8 |
| QA & Testing | 2 | 42 | 21 | 14 | 7 | 5/22/15 | 42/42 (100%) | 14/14 | 7/7 | 1.8 | 6.5 |
| Mobile Engineering | 3 | 31 | 15 | 10 | 6 | 1/20/10 | 31/31 (100%) | 10/10 | 6/6 | 1.4 | 5.1 |
| Database Administration | 3 | 31 | 17 | 9 | 5 | 3/23/5 | 31/31 (100%) | 9/9 | 5/5 | 1.3 | 5.2 |
| Data Analyst / Data Science | 1 | 95 | 36 | 30 | 29 | 11/55/29 | 83/95 (87.4%) | 22/30 | 23/29 | 1.6 | 6.9 |
| Machine Learning | 1 | 100 | 45 | 38 | 17 | 3/49/48 | 0/100 (0%) | 0/38 | 0/17 | 3 | 6.1 |
| Project & Program Associate | 1 | 100 | 47 | 52 | 1 | 31/41/28 | 0/100 (0%) | 0/52 | 0/1 | 5.6 | 5.7 |
| Business & Financial Analysis | 2 | 41 | 26 | 13 | 2 | 19/20/2 | 41/41 (100%) | 13/13 | 2/2 | 1.1 | 4.4 |
| Customer & Technical Support | 2 | 53 | 29 | 19 | 5 | 13/30/10 | 41/53 (77.4%) | 9/19 | 1/5 | 1.1 | 4.8 |
| Sales & Growth Marketing | 2 | 41 | 22 | 17 | 2 | 6/29/6 | 41/41 (100%) | 17/17 | 2/2 | 1.1 | 4.6 |
| UX & Design | 3 | 31 | 20 | 9 | 2 | 8/18/5 | 31/31 (100%) | 9/9 | 2/2 | 1.1 | 5.4 |
| HR & People Management | 3 | 31 | 16 | 15 | 0 | 7/21/3 | 31/31 (100%) | 15/15 | 0/0 | 1.1 | 5.4 |
| AI-Assisted Work Sample | 2 | 0 | 0 | 0 | 0 | 0/0/0 | 0/0 (0%) | 0/0 | 0/0 | — | — |

_Post-remediation: AI-Assisted Work Sample has **22** questions in `generated/ai-assisted-work-sample.json`._
| AI Governance & Responsible Use | 2 | 32 | 24 | 6 | 2 | 9/20/3 | 32/32 (100%) | 6/6 | 2/2 | 1.2 | 4.6 |
| Remote Collaboration & Async Communication | 2 | 31 | 25 | 6 | 0 | 11/16/4 | 31/31 (100%) | 6/6 | 0/0 | 1.1 | 4 |

**Difficulty spread** (stored where available, otherwise inferred from time + AI-resistance):

| Category | Easy | Medium | Hard | Source |
|---|--:|--:|--:|---|
| Frontend Engineering | 24 | 43 | 17 | mixed |
| Backend Engineering | 19 | 52 | 23 | mixed |
| DevOps & Cloud | 11 | 26 | 5 | stored |
| QA & Testing | 13 | 24 | 5 | stored |
| Mobile Engineering | 10 | 20 | 1 | stored |
| Database Administration | 11 | 18 | 2 | stored |
| Data Analyst / Data Science | 15 | 58 | 22 | mixed |
| Machine Learning | 3 | 44 | 53 | inferred |
| Project & Program Associate | 30 | 42 | 28 | inferred |
| Business & Financial Analysis | 14 | 23 | 4 | stored |
| Customer & Technical Support | 17 | 28 | 8 | mixed |
| Sales & Growth Marketing | 11 | 25 | 5 | stored |
| UX & Design | 8 | 22 | 1 | stored |
| HR & People Management | 8 | 20 | 3 | stored |
| AI-Assisted Work Sample | 0 | 0 | 0 | inferred |
| AI Governance & Responsible Use | 16 | 15 | 1 | stored |
| Remote Collaboration & Async Communication | 15 | 16 | 0 | stored |

## 2. Sub-skill coverage within categories

Topics come from explicit `[Bracket]` tags where present (ML, MBB/associate) and keyword clustering of the prompt otherwise. Keyword clustering is approximate; `Other/uncategorized` = no keyword matched.

| Category | Distinct topics | Top topics (count) | Concentrated? |
|---|--:|---|---|
| Frontend Engineering | 8 | React (50), CSS/Layout (12), TS/JS (11), Accessibility (5), Other/uncategorized (2) | ⚠️ 2 topics >70% |
| Backend Engineering | 13 | APIs (27), Other/uncategorized (14), Caching (10), SQL/DB (9), Messaging (9) | no |
| DevOps & Cloud | 8 | Containers/K8s (21), IaC (7), Other/uncategorized (3), CI-CD/Deploy (3), Incident/Triage (3) | ⚠️ 3 topics >70% |
| QA & Testing | 7 | Other/uncategorized (19), Testing (10), Accessibility (5), APIs (4), Performance (2) | ⚠️ 3 topics >70% |
| Mobile Engineering | 14 | React Native (4), Android (4), Other/uncategorized (4), iOS (4), Messaging (3) | no |
| Database Administration | 3 | SQL/DB (19), Other/uncategorized (10), Performance (2) | ⚠️ 2 topics >70% |
| Data Analyst / Data Science | 10 | SQL/DB (30), Stats/Experimentation (18), Data modeling/ETL (12), Analytics/Viz (12), Other/uncategorized (10) | ⚠️ 4 topics >70% |
| Machine Learning | 9 | LLM Architecture (15), Fine-Tuning (15), Prompt Engineering (15), Deployment (14), Google Cloud (14) | no |
| Project & Program Associate | 8 | Excel & data analysis (20), Structured problem-solving (16), Quantitative reasoning (15), Deck-building & communication (15), Market sizing & estimation (10) | no |
| Business & Financial Analysis | 8 | Financial modeling (24), Other/uncategorized (6), Customer comms (3), Hiring (2), Excel (2) | ⚠️ 2 topics >70% |
| Customer & Technical Support | 9 | Customer comms (23), Observability (8), Other/uncategorized (6), APIs (6), Incident/Triage (4) | ⚠️ 4 topics >70% |
| Sales & Growth Marketing | 11 | Prospecting (13), Growth/Ads (7), Analytics/Viz (6), CI-CD/Deploy (5), Customer comms (2) | ⚠️ 4 topics >70% |
| UX & Design | 9 | Usability (6), Accessibility (5), Other/uncategorized (5), IA/Wireframing (4), Customer comms (4) | no |
| HR & People Management | 10 | Other/uncategorized (9), Performance (6), Hiring (5), Compensation (3), Performance mgmt (3) | ⚠️ 4 topics >70% |
| AI-Assisted Work Sample | 0 | — | — |
| AI Governance & Responsible Use | 12 | LLMs/RAG (6), Governance/Compliance (5), Other/uncategorized (5), Customer comms (3), Prompting (3) | no |
| Remote Collaboration & Async Communication | 10 | Async comms (10), Other/uncategorized (6), Hiring (5), Customer comms (2), Messaging (2) | ⚠️ 4 topics >70% |

**Concentration flags (< 5 topics account for > 70%):** Frontend Engineering, DevOps & Cloud, QA & Testing, Database Administration, Data Analyst / Data Science, Business & Financial Analysis, Customer & Technical Support, Sales & Growth Marketing, HR & People Management, Remote Collaboration & Async Communication.

## 3. Screening viability per role

Bar: a credible 8–12 question screen at **two** seniority levels, sent to ~50 candidates without obvious reuse, needs ~3–4× the per-test size per level (≈60+ questions, ≥2 difficulty levels with depth, ≥2 question types, ≥5 topics).

| Category | Total | Verdict | Reason |
|---|--:|---|---|
| Frontend Engineering | 84 | 🟡 Thin | 2 topics cover >70% |
| Backend Engineering | 94 | ✅ Viable | 94 qs, 3 difficulty levels with depth, 3 types, 13 topics |
| DevOps & Cloud | 42 | 🟡 Thin | 3 topics cover >70% |
| QA & Testing | 42 | 🟡 Thin | 3 topics cover >70% |
| Mobile Engineering | 31 | 🟡 Thin | only 31 qs — enough for one level, thin for two without reuse |
| Database Administration | 31 | 🟡 Thin | 2 topics cover >70% |
| Data Analyst / Data Science | 95 | 🟡 Thin | 4 topics cover >70% |
| Machine Learning | 100 | ✅ Viable | 100 qs, 2 difficulty levels with depth, 3 types, 9 topics |
| Project & Program Associate | 100 | ✅ Viable | 100 qs, 3 difficulty levels with depth, 3 types, 8 topics |
| Business & Financial Analysis | 41 | 🟡 Thin | 2 topics cover >70% |
| Customer & Technical Support | 53 | 🟡 Thin | 4 topics cover >70% |
| Sales & Growth Marketing | 41 | 🟡 Thin | 4 topics cover >70% |
| UX & Design | 31 | 🟡 Thin | only 31 qs — enough for one level, thin for two without reuse |
| HR & People Management | 31 | 🟡 Thin | 4 topics cover >70% |
| AI-Assisted Work Sample | 0 | ❌ Not viable | no questions at all |
| AI Governance & Responsible Use | 32 | 🟡 Thin | only 32 qs — enough for one level, thin for two without reuse |
| Remote Collaboration & Async Communication | 31 | 🟡 Thin | 4 topics cover >70% |

## 4. Bundles

| Bundle | Category | Questions | Est. minutes |
|---|---|--:|--:|
| Backend screening | Backend Engineering | 8 | 35 |
| Frontend fundamentals | Frontend Engineering | 10 | 40 |
| Data analyst quick screen | Data Analyst / Data Science | 6 | 25 |
| Ops & support screen | Customer & Technical Support | 6 | 28 |
| Senior ML engineer screen | Machine Learning | 30 | 120 |
| LLM fundamentals & architecture | Machine Learning | 15 | 55 |
| Fine-tuning & prompt engineering | Machine Learning | 20 | 75 |
| ML deployment & Google Cloud | Machine Learning | 20 | 80 |
| ML engineer quick screen | Machine Learning | 10 | 45 |
| MBB associate full screen | Project & Program Associate | 30 | 90 |
| Problem solving & market sizing | Project & Program Associate | 20 | 55 |
| Quantitative & Excel analysis | Project & Program Associate | 25 | 60 |
| Communication & judgment | Project & Program Associate | 20 | 50 |
| Associate quick screen | Project & Program Associate | 10 | 30 |

Bundles exist for only **6 of 17** leaf categories at audit time: Backend Engineering, Frontend Engineering, Data Analyst / Data Science, Customer & Technical Support, Machine Learning, Project & Program Associate.

_Post-remediation: **29 bundles** across all content-ready leaf categories (see `lib/question-library/bundles.ts`)._

**Leaf categories with NO bundle:**

| Category | Questions | Tier | Classification |
|---|--:|--:|---|
| DevOps & Cloud | 42 | 2 | **packaging gap** (enough questions, no bundle) |
| QA & Testing | 42 | 2 | **packaging gap** (enough questions, no bundle) |
| Mobile Engineering | 31 | 3 | **packaging gap** (enough questions, no bundle) |
| Database Administration | 31 | 3 | **packaging gap** (enough questions, no bundle) |
| Business & Financial Analysis | 41 | 2 | **packaging gap** (enough questions, no bundle) |
| Sales & Growth Marketing | 41 | 2 | **packaging gap** (enough questions, no bundle) |
| UX & Design | 31 | 3 | **packaging gap** (enough questions, no bundle) |
| HR & People Management | 31 | 3 | **packaging gap** (enough questions, no bundle) |
| AI-Assisted Work Sample | 0 | 2 | content gap (empty) |
| AI Governance & Responsible Use | 32 | 2 | **packaging gap** (enough questions, no bundle) |
| Remote Collaboration & Async Communication | 31 | 2 | **packaging gap** (enough questions, no bundle) |

## 5. Data-quality checks

| Check | Count | Notes |
|---|--:|---|
| Auto-gradable MCQ with no correct index | 0 | should be 0 |
| MCQ with < 3 options | 0 | |
| MCQ with duplicate options | 0 | |
| Prompts under ~20 characters | 0 | |
| Placeholder/TODO prompts | 0 | |
| Orphaned (unknown category) | 0 | |
| Exact-duplicate prompts (normalized) | 36 (historical) → **0** in current sources | legacy/generated overlap in 3 categories — remediated (see below) |

**Historical exact-duplicate prompts by category (audit finding, remediated).** At audit time, three categories shipped their 12 legacy-seed questions *again* inside their `generated/*.json` file. Remediation removed those 12 generated copies per category from source, taught `apply-generated-library.mjs` to skip overlapping generated rows, and added `cleanup-duplicate-library-questions.mjs` for database cleanup. **Current source files have 865 unique prompts with 0 legacy/generated overlaps.**

| Category | Duplicate prompts (historical) | Raw total (audit) | Effective unique (post-remediation) |
|---|--:|--:|--:|
| Backend Engineering | 12 | 94 | 82 |
| Customer & Technical Support | 12 | 53 | 41 |
| Data Analyst / Data Science | 12 | 95 | 83 |

### Manual-grading exposure (not an error, but a scaling risk)

- **Short-answer:** 304 total, 187 with an exact-answer key (61.5%). The remaining 117 need manual or AI-assisted grading; most still lack a populated **rubric** or **model answer** even though those fields now exist.
- **Coding:** 133 total, 94 with test cases (70.7%). The rest are snippet/manual-review style; rubric/model answer can supplement where test cases are absent.

## Method & caveats

- **Sources (mirrors `scripts/validate-library.mjs`):** legacy seed `lib/question-library/seed-data.ts` (48, remapped to new leaf ids via migration 013), `lib/question-library/generated/*.json` (631 at audit, **595 after dedupe + 22 AI work samples = 617** in current tree), `ml-seed.json` (100 → Machine Learning), `mbb-seed.json` (100 → Project & Program Associate). **Historical raw total: 879.** **Current effective source total: 865** (843 deduped + 22 AI work samples). Migrations 004/011/012 only seed legacy+ML+MBB; generated questions reach the DB through `scripts/apply-generated-library.mjs`, not a migration.
- **Difficulty:** only `generated/*.json` carry a stored `difficulty`. For ML, MBB and legacy the difficulty columns are inferred with the app's own `inferredDifficulty()` (time + AI-resistance), flagged as `inferred`/`mixed` in §1.
- **Topics:** ML and MBB/associate use explicit `[Bracket]` tags (precise). All other categories are keyword-clustered from prompt text, so `Other/uncategorized` and the concentration flags are approximate — treat them as direction, not exact sub-skill taxonomy.
- **Grading aids (post-remediation schema):** `seniority`, `rubric`, and `model_answer` are persisted (migration 044). Auto-grade paths unchanged: `correct_answer_exact` (short-answer key) and `test_cases` (coding). Rubric/model answer support manual review and AI grading assist where populated.
- Original audit was read-only; subsequent remediation updated source files, scripts, schema, and bundles as noted above.