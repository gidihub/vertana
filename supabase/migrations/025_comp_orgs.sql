-- 025_comp_orgs.sql
-- Complimentary / internal organizations: comped orgs bypass candidate-credit
-- consumption and all paid-feature gates. This is an internal grant, orthogonal
-- to plan_tier. New orgs get the flag set at signup (see lib/auth/recruiter.ts);
-- this migration adds the column and backfills existing orgs by owner email.

alter table organizations
  add column if not exists is_comp boolean not null default false;

-- Backfill: any org whose owner signed up with an allowlisted comp domain.
-- Keep this list in sync with BUILT_IN_COMP_DOMAINS in lib/comp.ts.
update organizations o
set is_comp = true
from auth.users u
where u.id = o.owner_id
  and lower(split_part(u.email, '@', 2)) = any (array['mymdoc.com']);
