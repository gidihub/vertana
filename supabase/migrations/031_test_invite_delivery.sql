-- Richer candidate invite delivery: per-invite deadlines, scheduled sends, and
-- customizable email (subject / message / reply-to). Share-link rows leave these
-- null. `expires_at` already exists on test_invites (001) and is reused here as
-- the per-invite deadline.

alter table test_invites
  add column if not exists scheduled_at timestamptz,
  add column if not exists email_subject text,
  add column if not exists email_message text,
  add column if not exists email_reply_to text;

-- Allow a 'scheduled' delivery state for invites queued for a future send.
alter table test_invites
  drop constraint if exists test_invites_email_status_check;

alter table test_invites
  add constraint test_invites_email_status_check
  check (
    email_status is null
    or email_status in ('pending', 'sent', 'failed', 'scheduled')
  );

-- Cron processor scans for due scheduled invites; index the ones still queued.
create index if not exists test_invites_scheduled_idx
  on test_invites (scheduled_at)
  where email_status = 'scheduled' and is_share_link = false;
