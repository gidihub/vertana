-- Question library + AI resistance metadata

alter table questions
  alter column test_id drop not null;

alter table questions
  add column if not exists ai_resistance text not null default 'medium'
    check (ai_resistance in ('low', 'medium', 'high')),
  add column if not exists source text not null default 'custom'
    check (source in ('library', 'custom', 'ai_generated')),
  add column if not exists is_library_item boolean not null default false,
  add column if not exists library_category text,
  add column if not exists estimated_minutes int;

-- Library rows must not belong to a test; test questions must have test_id.
alter table questions
  add constraint questions_library_test_id_check
  check (
    (is_library_item = true and test_id is null)
    or (is_library_item = false and test_id is not null)
  );

create index questions_library_idx
  on questions (is_library_item, library_category)
  where is_library_item = true;

-- Authenticated users can read shared library items
create policy "anyone reads library questions"
  on questions for select
  using (is_library_item = true);
