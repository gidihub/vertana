-- Security hardening for the credit ledger:
--   1. Restrict ledger RPCs to the service role (they are security definer and
--      must never be callable by anon/authenticated clients using the anon key).
--   2. Make consume_credits idempotent per (attempt_id, reason) so concurrent or
--      retried submissions cannot double-charge (or, combined with the attempts
--      unique index below, double-charge a proctored start).
--   3. Prevent duplicate attempt rows per invite+candidate.

-- ---------------------------------------------------------------------------
-- Idempotent consumption
-- ---------------------------------------------------------------------------

create or replace function public.consume_credits(
  org_id_input uuid,
  amount_input int,
  reason_input text,
  attempt_id_input uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining int := amount_input;
  grant_rec record;
  grant_remaining int;
  take int;
begin
  if amount_input is null or amount_input <= 0 then
    return true;
  end if;

  -- Serialize concurrent consumption for this org.
  perform 1 from organizations where id = org_id_input for update;

  -- Idempotency: this attempt was already charged for this reason.
  if attempt_id_input is not null and exists (
    select 1 from credit_ledger
    where attempt_id = attempt_id_input
      and reason = reason_input
      and delta < 0
  ) then
    return true;
  end if;

  perform public.ensure_credit_ledger_bootstrap(org_id_input);

  if public.credit_balance(org_id_input) < amount_input then
    return false;
  end if;

  for grant_rec in
    select l.id, l.delta, l.expires_at
    from credit_ledger l
    where l.org_id = org_id_input
      and l.delta > 0
      and (l.expires_at is null or l.expires_at > now())
    order by l.expires_at asc nulls last, l.created_at asc
  loop
    exit when remaining <= 0;

    select grant_rec.delta + coalesce((
      select sum(c.delta)
      from credit_ledger c
      where c.source_ledger_id = grant_rec.id
    ), 0)
    into grant_remaining;

    if grant_remaining <= 0 then
      continue;
    end if;

    take := least(remaining, grant_remaining);

    insert into credit_ledger (
      org_id, delta, reason, attempt_id, source_ledger_id, expires_at
    ) values (
      org_id_input, -take, reason_input, attempt_id_input, grant_rec.id, grant_rec.expires_at
    );

    remaining := remaining - take;
  end loop;

  perform public.sync_credit_mirror(org_id_input);
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- One attempt per invite + candidate email
-- ---------------------------------------------------------------------------

create unique index if not exists attempts_invite_candidate_key
  on attempts (test_invite_id, candidate_email);

-- ---------------------------------------------------------------------------
-- Lock ledger RPCs down to the service role
-- ---------------------------------------------------------------------------

revoke all on function public.credit_balance(uuid) from public;
revoke all on function public.sync_credit_mirror(uuid) from public;
revoke all on function public.ensure_credit_ledger_bootstrap(uuid) from public;
revoke all on function public.consume_credits(uuid, int, text, uuid) from public;
revoke all on function public.grant_monthly_credits(uuid, int, timestamptz) from public;
revoke all on function public.record_pack_purchase(uuid, uuid, int, int, text) from public;

grant execute on function public.credit_balance(uuid) to service_role;
grant execute on function public.sync_credit_mirror(uuid) to service_role;
grant execute on function public.ensure_credit_ledger_bootstrap(uuid) to service_role;
grant execute on function public.consume_credits(uuid, int, text, uuid) to service_role;
grant execute on function public.grant_monthly_credits(uuid, int, timestamptz) to service_role;
grant execute on function public.record_pack_purchase(uuid, uuid, int, int, text) to service_role;
