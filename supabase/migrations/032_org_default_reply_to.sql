-- Org-wide default Reply-To for candidate invitation emails. When set, new
-- invites pre-fill this address so recruiters don't retype it each time.
alter table organizations
  add column if not exists default_reply_to text;
