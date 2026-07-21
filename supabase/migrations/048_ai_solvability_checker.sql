-- Public AI-solvability checker: anonymised cache, share tokens, optional email leads.

create table if not exists ai_solvability_checks (
  id uuid primary key default gen_random_uuid(),
  question_hash text not null,
  question_type text check (
    question_type is null
    or question_type in ('multiple_choice', 'short_answer', 'coding')
  ),
  role_context text,
  verdict text not null check (
    verdict in (
      'solved_outright',
      'mostly_solved',
      'partially_solved',
      'resists_ai'
    )
  ),
  ai_resistance text not null check (ai_resistance in ('low', 'medium', 'high')),
  model_attempt text not null,
  properties jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  share_token text unique,
  shared_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists ai_solvability_checks_question_hash_idx
  on ai_solvability_checks (question_hash);

create index if not exists ai_solvability_checks_created_at_idx
  on ai_solvability_checks (created_at desc);

create index if not exists ai_solvability_checks_verdict_idx
  on ai_solvability_checks (verdict);

alter table ai_solvability_checks enable row level security;

create table if not exists ai_solvability_email_leads (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references ai_solvability_checks (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_solvability_email_leads_created_at_idx
  on ai_solvability_email_leads (created_at desc);

alter table ai_solvability_email_leads enable row level security;

comment on table ai_solvability_checks is
  'Anonymised AI-solvability checker results keyed by question hash — no raw question text stored.';

comment on table ai_solvability_email_leads is
  'Optional email leads from the public AI-solvability checker.';
