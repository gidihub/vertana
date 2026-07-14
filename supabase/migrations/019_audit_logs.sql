-- Enterprise audit trail scaffold (Custom tier / compliance).

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete set null,
  user_id uuid,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_org_id_created_at_idx
  on audit_logs (org_id, created_at desc);

alter table audit_logs enable row level security;

create policy audit_logs_org_read on audit_logs
  for select
  using (
    org_id is not null
    and exists (
      select 1
      from team_members tm
      where tm.org_id = audit_logs.org_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'admin')
    )
  );
