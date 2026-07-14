-- Organization integrations: connections to external ATS / automation providers.
-- One row per (org, provider). Credentials (API keys, webhook URLs) are stored
-- server-side and never returned in full to the client. Writes go through the
-- service-role admin client in the API layer.

create table if not exists org_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'connected' check (status in ('connected', 'disabled')),
  -- Opaque provider config (api keys, webhook urls, subdomains, etc.).
  config jsonb not null default '{}'::jsonb,
  connected_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider)
);

create index if not exists org_integrations_org_id_idx
  on org_integrations (org_id);

alter table org_integrations enable row level security;

-- Members of the org can see which providers are connected (metadata only;
-- the API strips secrets before returning). Mutations are performed with the
-- service-role client after an owner/admin check in the route handler.
drop policy if exists org_integrations_org_read on org_integrations;
create policy org_integrations_org_read on org_integrations
  for select
  using (
    exists (
      select 1 from team_members tm
      where tm.org_id = org_integrations.org_id
        and tm.user_id = auth.uid()
    )
  );
