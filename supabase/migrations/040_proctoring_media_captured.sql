-- Durable "proctoring media was captured" marker on the attempt. The purge job
-- deletes proctoring_media rows once retention lapses, so a row count of zero is
-- ambiguous: it could mean "never captured" or "captured then deleted". This flag
-- survives purging, letting the report distinguish "purged" from "none" without
-- inferring it from elapsed time alone.

alter table attempts
  add column if not exists proctoring_media_captured boolean not null default false;

-- Backfill: any attempt that currently has (un-purged) media was captured.
update attempts a
set proctoring_media_captured = true
where exists (
  select 1 from proctoring_media m where m.attempt_id = a.id
);
