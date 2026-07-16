# Vertana — Feature Set

Vertana is a hiring-assessment platform for running fair, verifiable technical
and role-based screens. Recruiters build assessments (or generate them with AI),
invite candidates by link or email, monitor integrity, and grade results with
built-in analytics.

This document is a complete inventory of what the product does today. Items that
are configured but not yet fully wired end-to-end are called out in
[Known limitations](#known-limitations).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router), React, TypeScript |
| UI | Tailwind CSS, shadcn/ui + Base UI, Recharts, Monaco Editor |
| Database | PostgreSQL via Supabase (RLS, RPCs, SQL migrations) |
| Auth | Supabase Auth — email/password, Google OAuth, TOTP MFA |
| Email | Brevo transactional API |
| AI | OpenAI via the Vercel AI SDK |
| Code execution | Judge0 (RapidAPI or self-hosted) |
| Billing | Stripe — subscriptions, credit packs, extra seats |
| Scheduling | Vercel Cron (reminders, scheduled invites) |

---

## 1. Assessment creation

### Question types
- **Multiple choice** — single correct option, auto-graded.
- **Short answer** — free text; auto-graded when an exact-answer key is set, otherwise routed to manual review.
- **Coding** — in-browser Monaco editor with per-question test cases and partial credit based on the pass ratio.

### Test builder
- Create and edit assessments with title, description, and an ordered question list.
- Inline question editor: switch type, set points, reorder, and remove questions.
- Per-question **AI-resistance rating** (low / medium / high) with badges.
- Question metadata: difficulty, estimated minutes, points, and source (library / custom / AI-generated).
- **Draft → active → closed** lifecycle; save drafts and publish when ready.
- Pin frequently used tests to the sidebar for quick access.

### AI question generation
- **Describe & generate**: turn a short brief into a full test plan (suggested time, question count, and a mix of question types).
- Regenerate any single planned question.
- AI-suggested test details (title, description, time limit) derived from existing questions.
- Coding questions come back with runnable stdin/stdout test cases.
- Monthly AI-generation usage is metered per plan.

### Test settings
- **Time limit** with configurable timing policy (strict, normal +50%, relaxed +200%).
- **Passing score** threshold (0–100%) driving pass/fail.
- Optional **deadline** to auto-close a link.
- **Randomized question order** per candidate.
- **Proctoring toggle** (paid plans).
- **Certificate eligibility** (opt-in public certificates for top performers).
- **AI-tools policy** disclosure shown to candidates.
- Per-test **completion-notification** recipient list.

### Publishing & sharing
- One-click public **share link** per active test (`/t/[token]`).
- Links go live only while the test is active.

---

## 2. Question library

- **Two-level taxonomy** — parent groups (Engineering, Data & Analytics, Business, AI Fluency, Ways of Working) with leaf categories.
- Seeded, vetted content plus generated per-category question sets.
- **Predefined bundles** (e.g. backend screening, ML senior screen, associate screens) that assemble questions automatically.
- **Browse workspace** with search, category navigation, and type / AI-resistance filters and sorting.
- **Preview dialog** for MCQ and short answer, plus a live coding preview that runs test cases (rate-limited, unmetered).
- **Add to test** clones a library item into an assessment.
- **Per-question usage stats** — attempt counts, correct rate, and coding pass-rate buckets (shown once there is enough data).
- Library is embeddable directly inside the test builder.

---

## 3. Candidate experience

- **Token-based access** via a shareable link — no candidate account required.
- Guided multi-step flow: start → consent → proctoring setup (only on the optional/paid proctoring path) → test → certificate (only when the attempt is eligible and the candidate opts in) → done.
- Email capture at start; **resume** an in-progress attempt (answers, timer, and integrity state are restored).
- **Versioned consent** copy (tab-only or camera modes) with a stored snapshot (text, version, IP).
- Test runner: question navigation with progress, countdown timer with **auto-submit**, debounced **answer autosave**, and a submit confirmation.
- **Coding** in Monaco (JavaScript, TypeScript, Python) with starter templates, a scratch run, and runs against test cases.
- Clear error states for invalid, expired, closed, or already-submitted links.

---

## 4. Proctoring & integrity

- **Tab / focus monitoring** (when proctoring is on): visibility and blur detection with a warning on leaving the tab.
- **Tab-switch counter** persisted per attempt; attempts are flagged and surfaced with an integrity badge once they exceed the org threshold.
- **Camera proctoring** (feature-flagged): identity snapshot at start plus periodic snapshots, with cadence and caps that scale by plan.
- Proctoring media stored in Supabase storage with per-tier **retention windows**.
- **Recruiter review**: per-attempt media gallery (signed URLs) on both the results dashboard and candidate profile.
- Proctoring is a paid-plan capability.

---

## 5. Results, grading & analytics

### Grading
- Auto-grade MCQ (index match), short answer (normalized exact match when keyed), and coding (Judge0 test cases with partial points).
- **Manual grading** UI for open-ended and un-keyed answers, with a "needs scoring" indicator.
- Pass/fail evaluation against the test's passing score.

### Per-test results
- Candidate table with score, status, pass/fail, tab switches, and integrity flags.
- Expandable per-attempt detail (per-question answers and coding output).
- Consent record display.
- **CSV export** of results and answers.

### Charts
- **Invite funnel**: invited → opened → clicked → started → completed → dispositions.
- Score-distribution histogram and **grading distribution** bands.
- **Performance by category** (by library category or question type).
- **Top performers** by score or speed.
- Summary cards (average score, completion rate, needs-scoring count).

### Org-wide
- Dedicated **Analytics** page with org funnel and score distribution, plus a per-test selector on the dashboard.

---

## 6. Candidate management

- **Global candidates** table grouped by email, with search, per-assessment filtering, pagination, and aggregates (assessments taken, completed, average score, last activity, integrity flag).
- **Candidate profiles** with cross-test attempt history, durations, dispositions, and proctoring media — plus a print / PDF export (optionally including proctoring images).
- **Dispositions**: under review, shortlisted, rejected, hired — editable from results and profiles, and reflected in funnel stats.
- Org-level **data retention** setting for proctoring media, with per-capture expiry.

---

## 7. Email & notifications

- **Candidate invite emails** (branded HTML) with optional personalized message, custom subject, per-invite deadline, and configurable Reply-To (per invite or org default).
- **AI-drafted invite messages** generated from the test's questions.
- **Bulk invites** via paste, CSV upload, or email extraction.
- **Scheduled sends** delivered by cron; per-invite email status (pending / sent / failed / scheduled).
- **Resend** and **revoke** invites.
- **Reminders**: not-started (≈48h after invite) and deadline-approaching (within 24h).
- **Open & click tracking** via a pixel beacon and click-redirect, feeding first-open / first-click timestamps into the funnel.
- **Completion notifications** to per-test recipients; **team invite** emails.

---

## 8. Team & organization

- Team members with **owner / admin / member** roles.
- Invite teammates by email and role; view and revoke pending invites; accept via a tokenized link.
- **Seat usage** meter with included seats per plan and paid **extra seats**; seat limits enforced atomically.
- Automatic organization setup on signup; org profile and settings.
- **Audit logs** for recruiter actions.
- In-app **product tour** (guided walkthrough).

---

## 9. Billing & credits

- **Four plans** — Free, Starter, Growth, Custom — with volume limits and feature gates (certificates and proctoring on paid; ATS on Growth+; enterprise controls on Custom).
- Monthly and annual billing (annual discount), Stripe **checkout**, **customer portal**, webhook sync, and invoice history.
- **Purchasing-power (PPP) regional pricing** across tiers, a sanctions block list, and a cosmetic display-currency picker (billed in USD).
- **Credit ledger** as the source of truth: idempotent monthly grants, consumption on attempts (proctored start costs more than an unproctored completion), and insufficient-credit guards.
- One-time **credit packs** with subscriber discount.
- Metering surfaced for candidate credits, AI generations, and code executions.

---

## 10. Integrations

- **Integrations settings** page with a catalog of ATS providers (Greenhouse, Lever, Workable, Ashby, BambooHR, SmartRecruiters, and more) plus Zapier.
- Per-provider connect dialog with credential fields; credentials stored server-side; connect/disconnect restricted to owners/admins.
- ATS is gated to Growth+ plans.

> See [Known limitations](#known-limitations) for the current scope of ATS sync.

---

## 11. Compliance & data

- Versioned, auditable **consent** records (with IP) for proctored tests.
- Configurable **proctoring-media retention** and expiry.
- **Data export**: org-wide candidate CSV and per-test results CSV.
- **Security**: TOTP MFA enrollment, password change, and sign-out-all-sessions.
- **Legal** pages: Privacy, GDPR, Terms, and DPA.
- Candidate-controlled **certificate self-removal** (email-verified).

---

## 12. Certificates

- Per-test eligibility by percentile threshold (e.g. top performers).
- Post-submission **opt-in** issuance by the candidate.
- Public **certificate page** showing name, skill, percentile band, and issue date — with no employer identity by design.
- Share link, LinkedIn add-to-profile URL, and an HTML embed snippet.
- Candidate self-removal revokes the public certificate.
- Paid-plan feature.

---

## 13. Marketing & public site

- Landing page, pricing (with PPP detection and plan comparison), signup, and login (email/password + Google).
- **Feature** pages (test builder, AI generation, proctoring, results & reporting).
- **Use-case** pages (technical, remote, high-volume, agencies, campus, first technical hire).
- Assessment SEO landing pages across many roles and skills.
- **Comparison** pages vs. common alternatives.
- **Blog** with hiring and assessment-integrity content.
- Auto-generated sitemap and robots.

---

## Known limitations

These surfaces exist in the product but are intentionally partial today:

- **ATS integrations** store credentials and manage connection state, but do not yet push scores or dispositions out to connected providers.
- **Recruiter notification preferences** (completions, team activity, weekly digest, product news) are stored locally in the browser; only per-test completion emails are actually dispatched server-side.
- **Camera proctoring** requires explicit environment flags; tab/focus proctoring works without them.
- The **tab-switch threshold** is stored per org (default 3) without a dedicated settings control.
- **Weekly digest / team-activity emails** have preference UI but no send implementation.
- **Legal pages** ship as illustrative copy and are not a substitute for counsel-reviewed documents.
