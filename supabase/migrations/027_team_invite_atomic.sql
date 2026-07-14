-- Atomic, race-free team-invite creation with seat enforcement.
--
-- The previous flow read seat usage (members + pending invites vs. allowance)
-- in the app and then inserted separately, so two concurrent invites could both
-- pass the check and exceed the allowance. This function locks the organization
-- row, recomputes usage under that lock, and inserts only when capacity remains.
--
-- Allowance = plans.seats_included (per plan_tier, identical across PPP tiers)
-- + organizations.extra_seats. A null seats_included means unlimited (Custom).
-- On overflow it raises 'seat_limit_<allowance>' so the caller can surface it.

create or replace function create_team_invite_atomic(
  p_org_id uuid,
  p_email text,
  p_role text,
  p_token text,
  p_invited_by uuid
) returns setof team_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org organizations%rowtype;
  v_seats_included int;
  v_allowance int;
  v_used int;
  v_invite team_invites;
begin
  -- Serialize concurrent invites for this org on the organization row.
  select * into v_org from organizations where id = p_org_id for update;
  if not found then
    raise exception 'org_not_found';
  end if;

  select seats_included into v_seats_included
  from plans
  where name = v_org.plan_tier
  limit 1;

  -- Fail closed on a misconfigured org: an unmatched plan_tier is a config error,
  -- not "unlimited". Only a *matched* plan with null seats_included is unlimited.
  if not found then
    raise exception 'plan_not_configured_%', v_org.plan_tier;
  end if;

  -- Non-null allowance => enforce; null => unlimited (Custom), skip the gate.
  if v_seats_included is not null then
    v_allowance := v_seats_included + coalesce(v_org.extra_seats, 0);

    select
      (select count(*) from team_members where org_id = p_org_id)
      + (select count(*) from team_invites
           where org_id = p_org_id and status = 'pending')
      into v_used;

    if v_used >= v_allowance then
      raise exception 'seat_limit_%', v_allowance;
    end if;
  end if;

  insert into team_invites (org_id, email, role, token, status, invited_by)
  values (p_org_id, p_email, p_role, p_token, 'pending', p_invited_by)
  returning * into v_invite;

  return next v_invite;
  return;
end;
$$;
