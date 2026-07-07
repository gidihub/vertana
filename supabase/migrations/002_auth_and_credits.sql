-- Phase 2: atomic credit deduction + team member bootstrap policies

create or replace function public.deduct_candidate_credit(org_id_input uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  update organizations
  set credits_remaining = credits_remaining - 1
  where id = org_id_input
    and credits_remaining > 0;

  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

-- Allow service role inserts for auth bootstrap (handled via admin client in /api/auth/setup)
