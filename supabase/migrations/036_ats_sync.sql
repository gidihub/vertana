-- Outbound ATS sync: delivery status on integrations + an async delivery queue.
--
-- Events (attempt.submitted, score.finalized, disposition.changed) are enqueued
-- into `ats_delivery_jobs` at the point they happen and drained by a Vercel Cron
-- route (see app/api/cron/process-ats-deliveries). Requests never call a
-- provider synchronously. Both tables are written only via the service-role
-- admin client in the API/dispatch layer.

-- 1. Per-integration delivery status + signing secret.
alter table org_integrations
  add column if not exists secret text,
  add column if not exists sync_status text not null default 'idle'
    check (sync_status in ('idle', 'ok', 'error')),
  add column if not exists last_synced_at timestamptz,
  add column if not exists last_error text,
  add column if not exists last_error_at timestamptz;

-- 2. Async delivery queue. One row per (event × connected integration).
create table if not exists ats_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  event_type text not null
    check (event_type in ('attempt.submitted', 'score.finalized', 'disposition.changed')),
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivering', 'delivered', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  next_attempt_at timestamptz not null default now(),
  last_status int,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cron drains due, pending jobs oldest-first.
create index if not exists ats_delivery_jobs_due_idx
  on ats_delivery_jobs (status, next_attempt_at);

create index if not exists ats_delivery_jobs_org_idx
  on ats_delivery_jobs (org_id, created_at desc);

-- Service-role only: no client policies. RLS on with no policy denies all
-- anon/authenticated access; the service-role admin client bypasses RLS.
alter table ats_delivery_jobs enable row level security;
