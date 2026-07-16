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

-- Keep the durable marker correct going forward: mark the attempt the instant a
-- media row is inserted, even if the application-side update is skipped. Runs in
-- the inserting transaction so the flag and the media row commit atomically.
create or replace function public.mark_attempt_media_captured()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update attempts
  set proctoring_media_captured = true
  where id = new.attempt_id;
  return new;
end;
$$;

drop trigger if exists proctoring_media_captured_trigger on proctoring_media;

create trigger proctoring_media_captured_trigger
after insert on proctoring_media
for each row
execute function public.mark_attempt_media_captured();
