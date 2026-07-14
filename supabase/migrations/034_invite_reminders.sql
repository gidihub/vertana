-- Candidate invite reminders. Two one-shot nudges per invite, tracked
-- independently so each is sent at most once:
--   * reminder_not_started_at — set when we nudge a candidate who was emailed
--     but hasn't started, 48h after the invite was sent.
--   * reminder_deadline_at — set when we nudge a candidate ~24h before the
--     invite/test deadline if they haven't completed.
-- The cron reminder processor (see /api/cron/send-invite-reminders) claims a
-- reminder by setting its timestamp with a `... is null` guard, so concurrent
-- runs can't double-send.

alter table test_invites
  add column if not exists reminder_not_started_at timestamptz,
  add column if not exists reminder_deadline_at timestamptz;

-- Scanned by the reminder cron: real email invites still awaiting a reminder.
create index if not exists test_invites_reminder_not_started_idx
  on test_invites (email_sent_at)
  where email_status = 'sent'
    and is_share_link = false
    and reminder_not_started_at is null;

create index if not exists test_invites_reminder_deadline_idx
  on test_invites (expires_at)
  where is_share_link = false
    and reminder_deadline_at is null;
