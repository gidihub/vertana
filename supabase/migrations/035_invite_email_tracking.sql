-- Email open/click tracking for candidate invites.
-- Opens are recorded by a 1x1 tracking pixel; clicks by a redirect wrapper on
-- the "Start assessment" CTA. Both are best-effort and nullable.
alter table test_invites
  add column if not exists email_opened_at timestamptz,
  add column if not exists email_clicked_at timestamptz;

create index if not exists idx_test_invites_email_opened_at
  on test_invites (email_opened_at)
  where email_opened_at is not null;

create index if not exists idx_test_invites_email_clicked_at
  on test_invites (email_clicked_at)
  where email_clicked_at is not null;
