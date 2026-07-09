-- Test-level integrity, timing accommodation, and completion notification settings

alter table tests
  add column if not exists timing_policy text not null default 'normal'
    check (timing_policy in ('strict', 'normal', 'relaxed')),
  add column if not exists forbid_ai_tools boolean not null default false,
  add column if not exists notify_emails text[] not null default '{}';
