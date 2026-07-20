# Blog E-E-A-T content audit

Audit date: **2026-07-19**. Scope: all seven posts under `/blog/*` (resources hub).

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Posts | 7 | 7 |
| Avg word count | ~450 | ~1,262 |
| Team byline on every post | No | Yes — **The Vertana Team** |
| Published + updated dates visible | Partial | Yes |
| Sources section | 0/7 | 7/7 |
| Unattributed quote blocks | 5 | 0 (restyled as callouts) |
| Original library data cited | 0/7 | 5/7 |
| Editorial standards page | No | `/blog/editorial-standards` |
| Article JSON-LD (Organization author) | Partial | Yes |

---

## Per-post audit

### 1. `how-to-assess-frontend-engineers`

| Field | Before | After |
|-------|--------|-------|
| Word count | ~680 | **1,385** |
| Author | "Vertana team" (inconsistent) | The Vertana Team + editorial link |
| Dates | `date` only | Published 2026-06-24, Updated 2026-07-19 |
| Unsourced factual claims (flagged) | 3 | 0 — Schmidt & Hunter cited for validity; rest is framework/opinion |
| Unattributed quotes | **1** (fake cite) | 0 — converted to callout |
| Original data | No | Yes — 72 FE questions (19 coding) from library |
| Sources section | No | Yes — 2 sources |

**Fixes applied:** Rubric table, example stems, experience note, product section last, related posts linked.

---

### 2. `prevent-cheating-remote-technical-interviews`

| Field | Before | After |
|-------|--------|-------|
| Word count | ~620 | **1,222** |
| Author | Vertana team | The Vertana Team |
| Dates | date only | Published 2026-06-17, Updated 2026-07-19 |
| Unsourced factual claims | 2 (legal tone) | Softened + GDPR/EU AI Act cited |
| Unattributed quotes | **1** | 0 — callout |
| Original data | No | Yes — library scale + AI resistance tag counts |
| Sources section | No | Yes — 4 sources |

---

### 3. `take-home-tests-vs-live-coding`

| Field | Before | After |
|-------|--------|-------|
| Word count | ~480 | **1,201** |
| Author | Vertana team | The Vertana Team |
| Dates | date only | Published 2026-06-10, Updated 2026-07-19 |
| Unsourced factual claims | 2 | Reframed as trade-off opinion |
| Unattributed quotes | **1** | 0 — callout |
| Original data | No | No — format comparison; no platform stats used |
| Sources section | No | Yes — 2 sources |

---

### 4. `reduce-bias-structured-skills-assessments`

| Field | Before | After |
|-------|--------|-------|
| Word count | ~520 | **1,243** |
| Author | Vertana team | The Vertana Team |
| Dates | date only | Published 2026-06-03, Updated 2026-07-19 |
| Unsourced factual claims | **4** ("decades of research…") | Schmidt & Hunter + EEOC cited |
| Unattributed quotes | **1** | 0 — callout |
| Original data | No | Yes — rubric/scoring patterns from product work |
| Sources section | No | Yes — 2 sources |

---

### 5. `hiring-in-the-age-of-ai-cheating` (featured)

| Field | Before | After |
|-------|--------|-------|
| Word count | ~280 | **1,225** |
| Author | Vertana team | The Vertana Team |
| Dates | date only | Published 2026-07-10, Updated 2026-07-19 |
| Unsourced factual claims | 2 | Softened; AI resistance stats from library files |
| Unattributed quotes | 0 | 0 |
| Original data | No | Yes — 827 questions, 241/475/111 resistance tags |
| Sources section | No | Yes — 3 sources |

---

### 6. `ai-resistant-interview-questions`

| Field | Before | After |
|-------|--------|-------|
| Word count | ~180 | **1,352** |
| Author | Vertana team | The Vertana Team |
| Dates | date only | Published 2026-07-08, Updated 2026-07-19 |
| Unsourced factual claims | 2 | Reframed + library tagging described |
| Unattributed quotes | 0 | 0 |
| Original data | No | Yes — resistance tag breakdown |
| Sources section | No | Yes — 1 source |

---

### 7. `structured-hiring-reduces-bias`

| Field | Before | After |
|-------|--------|-------|
| Word count | **~45** (thin) | **1,209** |
| Author | Vertana team | The Vertana Team |
| Dates | date only | Published 2026-06-18, Updated 2026-07-19 |
| Unsourced factual claims | 2 | Schmidt & Hunter + EEOC |
| Unattributed quotes | 0 | 0 |
| Original data | No | Yes — structured scoring on platform |
| Sources section | No | Yes — 2 sources |

---

## Site-level changes

- **`/blog/editorial-standards`** — editorial policy, sourcing rules, team byline explanation.
- **Byline** links to editorial standards (not individual author pages).
- **`/blog/authors/[slug]`** redirects to editorial standards.
- **Article JSON-LD** uses `Organization` author/publisher (Vertana).
- **Product disclosure** line on every post.
- **CMS sync** — `npx tsx scripts/import-legacy-blog.ts` pushes content to `blog_posts`.

---

## Needs human input

Items **not** invented per E-E-A-T rules:

1. **OpenGraph images per post** — no unique OG artwork exists yet. Posts use cover image when set; otherwise Twitter/OG fall back to summary card without image. `{{TODO: design category OG templates or per-post covers}}`

2. **Migration `047_blog_eeat.sql`** — adds `sources` jsonb + `correction_note` on `blog_posts`. Run when DB is reachable: `pnpm migrate`. Until then, sources are embedded in CMS HTML content.

3. **Platform attempt/completion statistics** — only 10 attempts in production DB (too small to cite publicly). Omitted from all posts.

4. **Peer-reviewed citations beyond Schmidt & Hunter** — several posts would benefit from additional I/O psychology primary sources if you want to strengthen "Expertise" further. Candidates flagged but not fabricated:
   - `{{TODO: optional — Campion et al. structured interview meta-analysis if you want a second validity citation}}`
   - `{{TODO: optional — specific adverse-impact case law examples if expanding compliance post}}`

5. **Cover images** — no hero images assigned. `{{TODO: add cover_image_url per post in CMS or default OG asset in /public}}`

---

## Author identity (settled)

All posts use **The Vertana Team** only. No named authors, reviewers, or author archive pages.
