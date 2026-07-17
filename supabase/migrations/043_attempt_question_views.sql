-- Per-question timing log for an attempt, powering the recruiter "Session
-- playback" view that pairs camera frames with the question the candidate was
-- looking at when the frame was captured. These are best-effort telemetry
-- writes from the candidate side — a failed write must never block the
-- candidate's answer submission — so this is an append-only log, not a counter.
--
-- A candidate can visit the same question more than once, so each visit is its
-- own row. `entered_at` is set when the question becomes active; `left_at` is
-- set when they navigate away or submit; `answer_at_exit` snapshots the answer
-- as it stood when they left; `answer_change_count` counts edits during a visit.

create table if not exists attempt_question_views (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  entered_at timestamptz not null default now(),
  left_at timestamptz,
  answer_at_exit jsonb,
  answer_change_count int not null default 0,
  -- A closed window must not end before it started. left_at stays nullable to
  -- allow an in-flight visit, but the API only ever reports completed windows.
  constraint attempt_question_views_left_after_entered
    check (left_at is null or left_at >= entered_at)
);

-- Ordered scan per attempt (the join loads all of an attempt's views by time).
create index if not exists attempt_question_views_attempt_idx
  on attempt_question_views (attempt_id, entered_at);

alter table attempt_question_views enable row level security;

-- Recruiters read timing rows for attempts in their org (also enforced in API).
create policy attempt_question_views_org_read on attempt_question_views
  for select
  using (
    exists (
      select 1
      from attempts a
      join test_invites ti on ti.id = a.test_invite_id
      join tests t on t.id = ti.test_id
      join team_members tm on tm.org_id = t.org_id
      where a.id = attempt_question_views.attempt_id
        and tm.user_id = auth.uid()
    )
  );

-- Ownership-checked insert of a single completed question-view window. The
-- attempt must belong to the given invite (candidate-side writes go through the
-- service-role client after token validation). Kept permissive on lifecycle:
-- the final "leave on submit" event can legitimately arrive after submitted_at
-- is set, so submission state is intentionally not gated here.
create or replace function public.record_attempt_question_view(
  p_attempt_id         uuid,
  p_invite_id          uuid,
  p_question_id        uuid,
  p_entered_at         timestamptz,
  p_left_at            timestamptz default null,
  p_answer_at_exit     jsonb default null,
  p_answer_change_count int default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into attempt_question_views (
    attempt_id,
    question_id,
    entered_at,
    left_at,
    answer_at_exit,
    answer_change_count
  )
  select
    p_attempt_id,
    p_question_id,
    coalesce(p_entered_at, now()),
    p_left_at,
    p_answer_at_exit,
    greatest(0, coalesce(p_answer_change_count, 0))
  -- Ownership + integrity: the attempt must belong to the given invite, AND the
  -- question must belong to that invite's test. The question join rejects
  -- cross-test question ids that would otherwise pollute an attempt's timeline.
  where exists (
    select 1
    from attempts a
    join test_invites ti on ti.id = a.test_invite_id
    join questions q on q.test_id = ti.test_id
    where a.id = p_attempt_id
      and a.test_invite_id = p_invite_id
      and q.id = p_question_id
  );
end;
$$;

-- Security-definer function: only reachable through the token-validated route
-- (via the service-role client), never by direct client callers. Revoke the
-- default PUBLIC grant, then grant EXECUTE back to service_role only so
-- createAdminClient().rpc(...) can invoke it while anon/authenticated cannot.
revoke execute on function public.record_attempt_question_view(
  uuid, uuid, uuid, timestamptz, timestamptz, jsonb, int
) from public;

grant execute on function public.record_attempt_question_view(
  uuid, uuid, uuid, timestamptz, timestamptz, jsonb, int
) to service_role;
