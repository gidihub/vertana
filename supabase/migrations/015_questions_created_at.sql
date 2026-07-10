-- Track when questions were added (library items, AI-generated, custom).
alter table questions
  add column if not exists created_at timestamptz not null default now();

-- Existing seeded library content is established — not "new" on rollout.
update questions
  set created_at = '2026-01-01T00:00:00Z'::timestamptz
  where is_library_item = true;
