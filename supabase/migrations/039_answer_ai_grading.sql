-- AI grading assist: cache the model's suggested score + rationale on the answer
-- so it isn't recomputed on every report view. The suggestion is advisory only —
-- the recruiter's Accept/Override is what writes points_awarded / is_correct.

alter table answers
  add column if not exists ai_suggested_points numeric,
  add column if not exists ai_suggested_rationale text,
  add column if not exists ai_suggested_at timestamptz;
