-- Atomic, race-free removal of a user's own team membership.
--
-- The previous account-deletion flow counted owners and then deleted the
-- membership in two separate statements, so two concurrent last-two-owner
-- deletions could both observe count = 2, both delete, and leave the org with
-- zero owners. This function serializes membership mutations for the org on the
-- organization row, re-checks sole ownership under that lock, and deletes only
-- when it is safe to do so.
--
-- Returns a status string:
--   'deleted'    membership removed
--   'sole_owner' caller is the only owner; membership left intact
--   'not_found'  caller has no membership in this org

create or replace function delete_own_membership_atomic(
  p_org_id uuid,
  p_user_id uuid
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_owner_count int;
begin
  -- Serialize concurrent membership changes for this org on the org row.
  perform 1 from organizations where id = p_org_id for update;
  if not found then
    return 'not_found';
  end if;

  select role into v_role
  from team_members
  where org_id = p_org_id and user_id = p_user_id;

  if not found then
    return 'not_found';
  end if;

  if v_role = 'owner' then
    select count(*) into v_owner_count
    from team_members
    where org_id = p_org_id and role = 'owner';

    if v_owner_count <= 1 then
      return 'sole_owner';
    end if;
  end if;

  delete from team_members
  where org_id = p_org_id and user_id = p_user_id;

  return 'deleted';
end;
$$;
