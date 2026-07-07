-- Vertana core schema: organizations, tests, candidate flow, credits.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organizations & team
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid,
  created_at timestamptz not null default now(),
  plan_tier text not null default 'free'
    check (plan_tier in ('free', 'starter', 'growth', 'custom')),
  credits_remaining int not null default 10,
  credits_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  ai_generations_used int not null default 0,
  ai_generations_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month')
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  unique (org_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Tests & questions
-- ---------------------------------------------------------------------------

create table tests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  time_limit_seconds int not null default 1800,
  deadline timestamptz,
  randomize_questions boolean not null default false,
  requires_proctoring boolean not null default true,
  certificate_eligible boolean not null default false,
  certificate_percentile_threshold int not null default 25,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  type text not null check (type in ('multiple_choice', 'short_answer', 'coding')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb,
  points int not null default 1,
  order_index int not null default 0
);

-- ---------------------------------------------------------------------------
-- Invites, attempts, answers, consents, certificates
-- ---------------------------------------------------------------------------

create table test_invites (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  candidate_email text,
  token text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  expires_at timestamptz,
  is_share_link boolean not null default false
);

create unique index test_invites_one_share_link_per_test
  on test_invites (test_id)
  where is_share_link = true;

create table attempts (
  id uuid primary key default gen_random_uuid(),
  test_invite_id uuid not null references test_invites(id) on delete cascade,
  candidate_email text not null,
  started_at timestamptz,
  submitted_at timestamptz,
  score numeric,
  tab_switch_count int not null default 0,
  flagged boolean not null default false
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  response text not null default '',
  is_correct boolean,
  points_awarded numeric,
  unique (attempt_id, question_id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  consent_text_version text not null,
  consent_text_snapshot text not null,
  consented_at timestamptz not null default now(),
  ip_address text
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  candidate_name text not null,
  percentile numeric,
  issued_at timestamptz not null default now(),
  public_slug text not null unique,
  revoked_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index tests_org_id_idx on tests (org_id);
create index questions_test_id_idx on questions (test_id);
create index test_invites_token_idx on test_invites (token);
create index attempts_invite_id_idx on attempts (test_invite_id);
create index answers_attempt_id_idx on answers (attempt_id);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table team_members enable row level security;
alter table tests enable row level security;
alter table questions enable row level security;
alter table test_invites enable row level security;
alter table attempts enable row level security;
alter table answers enable row level security;
alter table consents enable row level security;
alter table certificates enable row level security;

-- Org members see only their org's data (requires Supabase Auth user_id).
create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from team_members where user_id = auth.uid()
$$;

create policy "org members read own org"
  on organizations for select
  using (id in (select public.user_org_ids()));

create policy "org members read team"
  on team_members for select
  using (org_id in (select public.user_org_ids()));

create policy "org members manage tests"
  on tests for all
  using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

create policy "org members manage questions"
  on questions for all
  using (
    test_id in (
      select id from tests where org_id in (select public.user_org_ids())
    )
  )
  with check (
    test_id in (
      select id from tests where org_id in (select public.user_org_ids())
    )
  );

create policy "org members manage invites"
  on test_invites for all
  using (
    test_id in (
      select id from tests where org_id in (select public.user_org_ids())
    )
  )
  with check (
    test_id in (
      select id from tests where org_id in (select public.user_org_ids())
    )
  );

create policy "org members read attempts"
  on attempts for select
  using (
    test_invite_id in (
      select ti.id from test_invites ti
      join tests t on t.id = ti.test_id
      where t.org_id in (select public.user_org_ids())
    )
  );

create policy "org members read answers"
  on answers for select
  using (
    attempt_id in (
      select a.id from attempts a
      join test_invites ti on ti.id = a.test_invite_id
      join tests t on t.id = ti.test_id
      where t.org_id in (select public.user_org_ids())
    )
  );

create policy "org members read consents"
  on consents for select
  using (
    attempt_id in (
      select a.id from attempts a
      join test_invites ti on ti.id = a.test_invite_id
      join tests t on t.id = ti.test_id
      where t.org_id in (select public.user_org_ids())
    )
  );

create policy "org members read certificates"
  on certificates for select
  using (
    attempt_id in (
      select a.id from attempts a
      join test_invites ti on ti.id = a.test_invite_id
      join tests t on t.id = ti.test_id
      where t.org_id in (select public.user_org_ids())
    )
  );

-- Candidate token access is handled via service-role API routes, not anon RLS.

-- ---------------------------------------------------------------------------
-- Credit reset (run monthly via Supabase cron / edge function)
-- ---------------------------------------------------------------------------

create or replace function public.reset_monthly_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update organizations
  set
    credits_remaining = case plan_tier
      when 'free' then 10
      when 'starter' then 100
      when 'growth' then 400
      else credits_remaining
    end,
    credits_reset_at = date_trunc('month', now()) + interval '1 month',
    ai_generations_used = 0,
    ai_generations_reset_at = date_trunc('month', now()) + interval '1 month'
  where credits_reset_at <= now() or ai_generations_reset_at <= now();
end;
$$;
