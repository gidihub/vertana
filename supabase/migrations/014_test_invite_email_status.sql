-- Per-candidate invite email delivery tracking (share links leave these null).
alter table test_invites
  add column if not exists email_status text,
  add column if not exists email_error text,
  add column if not exists email_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'test_invites'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%email_status%'
  ) then
    alter table test_invites
      add constraint test_invites_email_status_check
      check (email_status is null or email_status in ('pending', 'sent', 'failed'));
  end if;
end $$;

create index if not exists test_invites_email_status_idx
  on test_invites (test_id, email_status)
  where is_share_link = false;
