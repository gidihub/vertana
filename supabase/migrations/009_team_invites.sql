-- Team invites and member metadata

alter table team_members
  add column if not exists created_at timestamptz not null default now();

create table if not exists team_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create unique index if not exists team_invites_pending_email_idx
  on team_invites (org_id, lower(email))
  where status = 'pending';

alter table team_invites enable row level security;

create policy "org members read team invites"
  on team_invites for select
  using (org_id in (select user_org_ids()));
