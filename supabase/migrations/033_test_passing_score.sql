-- Per-test passing score (percentage). Candidates whose graded score is at or
-- above this threshold are considered a "pass". Required per test; existing
-- rows are backfilled to the default of 70%.

alter table tests
  add column if not exists passing_score int not null default 70
  check (passing_score between 0 and 100);
