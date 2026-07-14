-- Atomic, race-free extra-seat updates with a decrease guard.
--
-- The previous flow (lib/billing/manage-seats.ts) read seat usage in the app and
-- then wrote organizations.extra_seats separately, so a concurrent
-- create_team_invite_atomic could admit a seat against a stale usage snapshot, or
-- a decrease could leave used seats above the persisted total. This function
-- locks the organization row (the same lock create_team_invite_atomic takes),
-- recomputes usage under that lock, validates the new total, and persists
-- extra_seats atomically. It returns the previous extra_seats so the caller can
-- revert if the coordinated Stripe mutation fails.
--
-- Allowance = plans.seats_included (per plan_tier) + p_extra_seats. A matched
-- plan with null seats_included is unlimited (Custom); an unmatched plan_tier is
-- a configuration error and fails closed. On a decrease below current usage it
-- raises 'seat_below_usage_<new_total>_<used>'.

create or replace function set_extra_seats_atomic(
  p_org_id uuid,
  p_extra_seats int
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org organizations%rowtype;
  v_seats_included int;
  v_previous int;
  v_new_total int;
  v_used int;
begin
  -- Mirror the app-layer bound (lib/billing/manage-seats.ts): reject null,
  -- negative, and anything above the 100 extra-seat maximum.
  if p_extra_seats is null or p_extra_seats < 0 or p_extra_seats > 100 then
    raise exception 'invalid_extra_seats';
  end if;

  -- Serialize against concurrent invites/seat changes on the organization row.
  select * into v_org from organizations where id = p_org_id for update;
  if not found then
    raise exception 'org_not_found';
  end if;

  v_previous := coalesce(v_org.extra_seats, 0);

  select seats_included into v_seats_included
  from plans
  where name = v_org.plan_tier
  limit 1;

  -- Fail closed on a misconfigured org; only a matched null is "unlimited".
  if not found then
    raise exception 'plan_not_configured_%', v_org.plan_tier;
  end if;

  -- Bounded plan => never drop the total below current usage.
  if v_seats_included is not null then
    v_new_total := v_seats_included + p_extra_seats;

    select
      (select count(*) from team_members where org_id = p_org_id)
      + (select count(*) from team_invites
           where org_id = p_org_id and status = 'pending')
      into v_used;

    if v_new_total < v_used then
      raise exception 'seat_below_usage_%_%', v_new_total, v_used;
    end if;
  end if;

  update organizations set extra_seats = p_extra_seats where id = p_org_id;

  return v_previous;
end;
$$;
