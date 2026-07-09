-- Coding IDE: test cases on questions, execution metadata on answers

alter table questions
  add column if not exists test_cases jsonb not null default '[]'::jsonb;

alter table answers
  add column if not exists execution_output text,
  add column if not exists execution_status text,
  add column if not exists test_cases_passed int,
  add column if not exists test_cases_total int;
