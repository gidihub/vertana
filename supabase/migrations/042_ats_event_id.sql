-- Stable, immutable event ID for outbound ATS delivery jobs. Assigned once when
-- the event is created and preserved across queueing and retries so it can be
-- used as the outbound idempotency key. Enforcing uniqueness on
-- (org_id, provider, event_id) prevents the same event being enqueued twice for
-- a provider (duplicate fan-out / double dispatch).

alter table ats_delivery_jobs
  add column if not exists event_id uuid;

-- New rows get a stable ID by default (the dispatch layer also sets one
-- explicitly), so the column can never be left NULL going forward.
alter table ats_delivery_jobs
  alter column event_id set default gen_random_uuid();

-- Backfill every legacy/queued NULL row (including jobs still pending delivery)
-- BEFORE enforcing NOT NULL, so already-enqueued jobs keep a valid idempotency
-- key and the constraint can be applied without failing.
update ats_delivery_jobs
set event_id = gen_random_uuid()
where event_id is null;

alter table ats_delivery_jobs
  alter column event_id set not null;

-- Prevents the same event being enqueued twice for a provider. The predicate is
-- retained to preserve the originally-deployed index definition; with event_id
-- now NOT NULL it covers every row.
create unique index if not exists ats_delivery_jobs_event_uniq
  on ats_delivery_jobs (org_id, provider, event_id)
  where event_id is not null;
