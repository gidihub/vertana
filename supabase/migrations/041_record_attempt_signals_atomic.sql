-- Atomic accumulation of proctoring integrity signals for an in-progress
-- attempt. Previously the app read the row, computed new counters, and wrote
-- them back — a read-modify-write that loses increments under concurrent
-- signal posts (fullscreen exits, mouse-out, time-outside). This function does
-- the whole thing in one statement so counters can't be clobbered.
--
-- Ownership and lifecycle are enforced in the WHERE clause: the row must belong
-- to the given invite and must not be submitted yet. outsideMs is validated and
-- clamped server-side before it is accumulated. user_agent and dual_screen are
-- only set once (when currently null), matching the prior behaviour.

create or replace function public.record_attempt_signals(
  p_attempt_id    uuid,
  p_invite_id     uuid,
  p_user_agent    text default null,
  p_dual_screen   boolean default null,
  p_fullscreen_exit boolean default false,
  p_mouse_out     boolean default false,
  p_outside_ms    bigint default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outside bigint;
begin
  -- Validate + clamp: reject negatives/NULL, cap a single report at one hour.
  v_outside := greatest(0, least(coalesce(p_outside_ms, 0), 60 * 60 * 1000));

  update attempts
  set
    user_agent = case
      when p_user_agent is not null and user_agent is null
        then left(p_user_agent, 512)
      else user_agent
    end,
    dual_screen = case
      when p_dual_screen is not null and dual_screen is null
        then p_dual_screen
      else dual_screen
    end,
    fullscreen_exits = fullscreen_exits + case when p_fullscreen_exit then 1 else 0 end,
    mouse_out_count = mouse_out_count + case when p_mouse_out then 1 else 0 end,
    time_outside_ms = time_outside_ms + v_outside
  where id = p_attempt_id
    and test_invite_id = p_invite_id
    and submitted_at is null;
end;
$$;
