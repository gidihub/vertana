-- Per-question proctoring: associate a captured snapshot with the question the
-- candidate was viewing when it was taken. Both columns are nullable so the
-- one-time identity/face_match snapshot (and any legacy rows) stay unlinked.
--
-- question_id is set null on question delete so media survives question edits;
-- question_index preserves the order the candidate saw for display/ordering.

alter table proctoring_media
  add column if not exists question_id uuid references questions(id) on delete set null,
  add column if not exists question_index int;

create index if not exists proctoring_media_question_id_idx
  on proctoring_media (question_id);
