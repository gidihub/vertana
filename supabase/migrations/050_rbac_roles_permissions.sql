-- RBAC: six system roles, per-org permission matrix, test assignments, reviewer shares.

-- ---------------------------------------------------------------------------
-- Role definitions (global system roles)
-- ---------------------------------------------------------------------------

create table if not exists roles (
  id text primary key,
  label text not null,
  description text not null default '',
  is_locked boolean not null default false,
  is_system boolean not null default true,
  sort_order int not null default 0
);

insert into roles (id, label, description, is_locked, is_system, sort_order) values
  ('owner', 'Owner', 'Account holder — billing, full access, transfer ownership', true, true, 10),
  ('admin', 'Admin', 'Full workspace access except billing ownership transfer', true, true, 20),
  ('hiring_manager', 'Hiring Manager', 'Own reqs — review, grade, shortlist assigned roles', false, true, 30),
  ('recruiter', 'Recruiter', 'Create tests, invite, grade, move candidates', false, true, 40),
  ('reviewer', 'Reviewer', 'Read-mostly — view results, leave scores and notes', false, true, 50),
  ('billing_manager', 'Billing Manager', 'Billing and seats only — no candidate or test access', false, true, 60)
on conflict (id) do nothing;

-- Per-org permission toggles for configurable roles.
create table if not exists org_role_permissions (
  org_id uuid not null references organizations(id) on delete cascade,
  role_id text not null references roles(id) on delete cascade,
  permission_key text not null,
  enabled boolean not null,
  primary key (org_id, role_id, permission_key)
);

-- Scope settings (assessment view scope, reviewer share scope) per role per org.
create table if not exists org_role_settings (
  org_id uuid not null references organizations(id) on delete cascade,
  role_id text not null references roles(id) on delete cascade,
  assessment_view_scope text not null default 'assigned'
    check (assessment_view_scope in ('all', 'assigned')),
  reviewer_scope text not null default 'shared'
    check (reviewer_scope in ('all', 'shared')),
  primary key (org_id, role_id)
);

-- Which tests/assessments a user owns (for assigned-scope filtering).
create table if not exists test_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (test_id, user_id)
);

create index if not exists test_assignments_user_org_idx
  on test_assignments (org_id, user_id);

-- Explicit shares for reviewers in "shared" scope.
create table if not exists reviewer_shares (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  test_id uuid references tests(id) on delete cascade,
  attempt_id uuid references attempts(id) on delete cascade,
  user_id uuid not null,
  shared_by uuid,
  created_at timestamptz not null default now(),
  check (test_id is not null or attempt_id is not null)
);

create index if not exists reviewer_shares_user_org_idx
  on reviewer_shares (org_id, user_id);

-- Expand team_members / team_invites role enum; migrate legacy "member" → "recruiter".
alter table team_members drop constraint if exists team_members_role_check;
update team_members set role = 'recruiter' where role = 'member';
alter table team_members
  add constraint team_members_role_check
  check (role in (
    'owner', 'admin', 'hiring_manager', 'recruiter', 'reviewer', 'billing_manager'
  ));

alter table team_invites drop constraint if exists team_invites_role_check;
update team_invites set role = 'recruiter' where role = 'member';
alter table team_invites
  add constraint team_invites_role_check
  check (role in (
    'owner', 'admin', 'hiring_manager', 'recruiter', 'reviewer', 'billing_manager'
  ));

-- Auto-assign test creator on insert (supports assigned-scope filtering).
create or replace function assign_test_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and old.created_by is distinct from new.created_by
     and old.created_by is not null then
    delete from test_assignments
    where test_id = new.id and user_id = old.created_by;
  end if;

  if new.created_by is not null then
    insert into test_assignments (org_id, test_id, user_id)
    values (new.org_id, new.id, new.created_by)
    on conflict (test_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists tests_assign_creator on tests;
create trigger tests_assign_creator
  after insert or update of created_by on tests
  for each row
  execute function assign_test_creator();

-- Backfill assignments for existing tests with a creator.
insert into test_assignments (org_id, test_id, user_id)
select t.org_id, t.id, t.created_by
from tests t
where t.created_by is not null
on conflict (test_id, user_id) do nothing;

-- Seed default permissions for every existing org (configurable roles only).
-- Defaults match the product spec presets; orgs can customize via the matrix UI.

create or replace function seed_org_rbac_defaults(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Hiring Manager defaults
  insert into org_role_permissions (org_id, role_id, permission_key, enabled) values
    (p_org_id, 'hiring_manager', 'tests.create', false),
    (p_org_id, 'hiring_manager', 'tests.edit', false),
    (p_org_id, 'hiring_manager', 'tests.delete', false),
    (p_org_id, 'hiring_manager', 'tests.view_library', true),
    (p_org_id, 'hiring_manager', 'assessments.create', false),
    (p_org_id, 'hiring_manager', 'assessments.edit', true),
    (p_org_id, 'hiring_manager', 'assessments.archive', false),
    (p_org_id, 'hiring_manager', 'candidates.invite', true),
    (p_org_id, 'hiring_manager', 'candidates.grade', true),
    (p_org_id, 'hiring_manager', 'candidates.delete', false),
    (p_org_id, 'hiring_manager', 'candidates.send_results', true),
    (p_org_id, 'hiring_manager', 'candidates.send_reminders', true),
    (p_org_id, 'hiring_manager', 'candidates.extend_expiry', true),
    (p_org_id, 'hiring_manager', 'media.view', true),
    (p_org_id, 'hiring_manager', 'settings.billing', false),
    (p_org_id, 'hiring_manager', 'settings.integrations', false),
    (p_org_id, 'hiring_manager', 'settings.email_templates', false),
    (p_org_id, 'hiring_manager', 'settings.company_info', false),
    (p_org_id, 'hiring_manager', 'settings.data_retention', false),
    (p_org_id, 'hiring_manager', 'analytics.view_org', true),
    (p_org_id, 'hiring_manager', 'team.manage', false)
  on conflict do nothing;

  insert into org_role_settings (org_id, role_id, assessment_view_scope, reviewer_scope)
  values (p_org_id, 'hiring_manager', 'assigned', 'all')
  on conflict do nothing;

  -- Recruiter defaults
  insert into org_role_permissions (org_id, role_id, permission_key, enabled) values
    (p_org_id, 'recruiter', 'tests.create', true),
    (p_org_id, 'recruiter', 'tests.edit', true),
    (p_org_id, 'recruiter', 'tests.delete', false),
    (p_org_id, 'recruiter', 'tests.view_library', true),
    (p_org_id, 'recruiter', 'assessments.create', true),
    (p_org_id, 'recruiter', 'assessments.edit', true),
    (p_org_id, 'recruiter', 'assessments.archive', false),
    (p_org_id, 'recruiter', 'candidates.invite', true),
    (p_org_id, 'recruiter', 'candidates.grade', true),
    (p_org_id, 'recruiter', 'candidates.delete', false),
    (p_org_id, 'recruiter', 'candidates.send_results', false),
    (p_org_id, 'recruiter', 'candidates.send_reminders', true),
    (p_org_id, 'recruiter', 'candidates.extend_expiry', true),
    (p_org_id, 'recruiter', 'media.view', false),
    (p_org_id, 'recruiter', 'settings.billing', false),
    (p_org_id, 'recruiter', 'settings.integrations', false),
    (p_org_id, 'recruiter', 'settings.email_templates', false),
    (p_org_id, 'recruiter', 'settings.company_info', false),
    (p_org_id, 'recruiter', 'settings.data_retention', false),
    (p_org_id, 'recruiter', 'analytics.view_org', false),
    (p_org_id, 'recruiter', 'team.manage', false)
  on conflict do nothing;

  insert into org_role_settings (org_id, role_id, assessment_view_scope, reviewer_scope)
  values (p_org_id, 'recruiter', 'assigned', 'all')
  on conflict do nothing;

  -- Reviewer defaults (read-mostly)
  insert into org_role_permissions (org_id, role_id, permission_key, enabled) values
    (p_org_id, 'reviewer', 'tests.create', false),
    (p_org_id, 'reviewer', 'tests.edit', false),
    (p_org_id, 'reviewer', 'tests.delete', false),
    (p_org_id, 'reviewer', 'tests.view_library', true),
    (p_org_id, 'reviewer', 'assessments.create', false),
    (p_org_id, 'reviewer', 'assessments.edit', false),
    (p_org_id, 'reviewer', 'assessments.archive', false),
    (p_org_id, 'reviewer', 'candidates.invite', false),
    (p_org_id, 'reviewer', 'candidates.grade', true),
    (p_org_id, 'reviewer', 'candidates.delete', false),
    (p_org_id, 'reviewer', 'candidates.send_results', false),
    (p_org_id, 'reviewer', 'candidates.send_reminders', false),
    (p_org_id, 'reviewer', 'candidates.extend_expiry', false),
    (p_org_id, 'reviewer', 'media.view', false),
    (p_org_id, 'reviewer', 'settings.billing', false),
    (p_org_id, 'reviewer', 'settings.integrations', false),
    (p_org_id, 'reviewer', 'settings.email_templates', false),
    (p_org_id, 'reviewer', 'settings.company_info', false),
    (p_org_id, 'reviewer', 'settings.data_retention', false),
    (p_org_id, 'reviewer', 'analytics.view_org', false),
    (p_org_id, 'reviewer', 'team.manage', false)
  on conflict do nothing;

  insert into org_role_settings (org_id, role_id, assessment_view_scope, reviewer_scope)
  values (p_org_id, 'reviewer', 'assigned', 'shared')
  on conflict do nothing;

  -- Billing Manager defaults
  insert into org_role_permissions (org_id, role_id, permission_key, enabled) values
    (p_org_id, 'billing_manager', 'tests.create', false),
    (p_org_id, 'billing_manager', 'tests.edit', false),
    (p_org_id, 'billing_manager', 'tests.delete', false),
    (p_org_id, 'billing_manager', 'tests.view_library', false),
    (p_org_id, 'billing_manager', 'assessments.create', false),
    (p_org_id, 'billing_manager', 'assessments.edit', false),
    (p_org_id, 'billing_manager', 'assessments.archive', false),
    (p_org_id, 'billing_manager', 'candidates.invite', false),
    (p_org_id, 'billing_manager', 'candidates.grade', false),
    (p_org_id, 'billing_manager', 'candidates.delete', false),
    (p_org_id, 'billing_manager', 'candidates.send_results', false),
    (p_org_id, 'billing_manager', 'candidates.send_reminders', false),
    (p_org_id, 'billing_manager', 'candidates.extend_expiry', false),
    (p_org_id, 'billing_manager', 'media.view', false),
    (p_org_id, 'billing_manager', 'settings.billing', true),
    (p_org_id, 'billing_manager', 'settings.integrations', false),
    (p_org_id, 'billing_manager', 'settings.email_templates', false),
    (p_org_id, 'billing_manager', 'settings.company_info', false),
    (p_org_id, 'billing_manager', 'settings.data_retention', false),
    (p_org_id, 'billing_manager', 'analytics.view_org', false),
    (p_org_id, 'billing_manager', 'team.manage', false)
  on conflict do nothing;

  insert into org_role_settings (org_id, role_id, assessment_view_scope, reviewer_scope)
  values (p_org_id, 'billing_manager', 'assigned', 'shared')
  on conflict do nothing;
end;
$$;

-- Seed all existing orgs.
do $$
declare
  r record;
begin
  for r in select id from organizations loop
    perform seed_org_rbac_defaults(r.id);
  end loop;
end;
$$;
