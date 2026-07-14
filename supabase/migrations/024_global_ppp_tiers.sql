-- Generalise PPP pricing from Africa-only (anchor, sa_eg, gh, ke, floor) to a
-- global 5-tier ladder (t1..t5). Breaking rename — done deliberately while the
-- catalog is small and no live Stripe prices exist yet.
--
--   anchor -> t1   (full price, unchanged meaning)
--   sa_eg  -> t3
--   gh     -> t4   (Ghana + Kenya merge into t4)
--   ke     -> t4
--   floor  -> t5
--   t2 is new (inserted between t1 and t3)
--
-- Runs correctly on both an existing DB (old tiers) and a fresh one that just
-- applied 022's old seed: it remaps org tiers, then rebuilds the plan/pack
-- catalog with the new tiers and price points. Re-run pnpm setup:stripe after
-- this to (re)provision Stripe prices for the new tiers.

-- 1. organizations.ppp_tier: relax the check, remap values, re-add the check ----
alter table organizations
  drop constraint if exists organizations_ppp_tier_check;

update organizations set ppp_tier = case ppp_tier
  when 'anchor' then 't1'
  when 'sa_eg'  then 't3'
  when 'gh'     then 't4'
  when 'ke'     then 't4'
  when 'floor'  then 't5'
  else ppp_tier
end
where ppp_tier is not null;

alter table organizations
  add constraint organizations_ppp_tier_check
  check (ppp_tier is null or ppp_tier in ('t1', 't2', 't3', 't4', 't5'));

-- 2. Rebuild the plan + credit-pack catalog -----------------------------------
-- Detach references so the catalog can be rebuilt cleanly. Pre-launch there are
-- no live Stripe prices to preserve; subscriptions/purchases keep their org and
-- Stripe ids and are re-linked by the webhook on the next sync.
update subscriptions set plan_id = null where plan_id is not null;
update pack_purchases set credit_pack_id = null where credit_pack_id is not null;

alter table plans drop constraint if exists plans_tier_check;
alter table credit_packs drop constraint if exists credit_packs_tier_check;

delete from plans;
delete from credit_packs;

alter table plans
  add constraint plans_tier_check check (tier in ('t1', 't2', 't3', 't4', 't5'));
alter table credit_packs
  add constraint credit_packs_tier_check check (tier in ('t1', 't2', 't3', 't4', 't5'));

-- Plans (values mirror lib/pricing/config.ts) ---------------------------------
insert into plans (
  name, tier, monthly_price_cents, yearly_price_cents, monthly_credits,
  ai_generations_per_month, active_test_limit,
  has_certificates, has_ats, has_enterprise_controls, has_proctoring
) values
  -- Free (identical across tiers) — no proctoring
  ('free', 't1', 0, 0, 10, 5, 2, false, false, false, false),
  ('free', 't2', 0, 0, 10, 5, 2, false, false, false, false),
  ('free', 't3', 0, 0, 10, 5, 2, false, false, false, false),
  ('free', 't4', 0, 0, 10, 5, 2, false, false, false, false),
  ('free', 't5', 0, 0, 10, 5, 2, false, false, false, false),
  -- Starter
  ('starter', 't1', 1900, 15600, 100, 30, null, true, false, false, true),
  ('starter', 't2', 1300, 10800, 100, 30, null, true, false, false, true),
  ('starter', 't3',  900,  7200, 100, 30, null, true, false, false, true),
  ('starter', 't4',  700,  6000, 100, 30, null, true, false, false, true),
  ('starter', 't5',  500,  3600, 100, 30, null, true, false, false, true),
  -- Growth
  ('growth', 't1', 3900, 32400, 300, 100, null, true, true, false, true),
  ('growth', 't2', 2700, 22800, 300, 100, null, true, true, false, true),
  ('growth', 't3', 1900, 15600, 300, 100, null, true, true, false, true),
  ('growth', 't4', 1500, 12000, 300, 100, null, true, true, false, true),
  ('growth', 't5', 1000,  8400, 300, 100, null, true, true, false, true),
  -- Custom (contact sales)
  ('custom', 't1', null, null, null, null, null, true, true, true, true),
  ('custom', 't2', null, null, null, null, null, true, true, true, true),
  ('custom', 't3', null, null, null, null, null, true, true, true, true),
  ('custom', 't4', null, null, null, null, null, true, true, true, true),
  ('custom', 't5', null, null, null, null, null, true, true, true, true)
on conflict (name, tier) do update set
  monthly_price_cents = excluded.monthly_price_cents,
  yearly_price_cents = excluded.yearly_price_cents,
  monthly_credits = excluded.monthly_credits,
  ai_generations_per_month = excluded.ai_generations_per_month,
  active_test_limit = excluded.active_test_limit,
  has_certificates = excluded.has_certificates,
  has_ats = excluded.has_ats,
  has_enterprise_controls = excluded.has_enterprise_controls,
  has_proctoring = excluded.has_proctoring;

-- Credit packs (t1 base: 50=$49, 200=$149, 500=$299; lower tiers apply the
-- tier discount, rounded to whole dollars; subscriber = 15% off, rounded) -----
insert into credit_packs (name, credits, tier, price_cents, subscriber_price_cents) values
  -- t1 (no discount)
  ('pack_50',  50,  't1',  4900,  4165),
  ('pack_200', 200, 't1', 14900, 12665),
  ('pack_500', 500, 't1', 29900, 25415),
  -- t2 (30% off)
  ('pack_50',  50,  't2',  3400,  2890),
  ('pack_200', 200, 't2', 10400,  8840),
  ('pack_500', 500, 't2', 20900, 17765),
  -- t3 (50% off)
  ('pack_50',  50,  't3',  2400,  2040),
  ('pack_200', 200, 't3',  7400,  6290),
  ('pack_500', 500, 't3', 14900, 12665),
  -- t4 (60% off)
  ('pack_50',  50,  't4',  1900,  1615),
  ('pack_200', 200, 't4',  5900,  5015),
  ('pack_500', 500, 't4', 11900, 10115),
  -- t5 (70% off)
  ('pack_50',  50,  't5',  1400,  1190),
  ('pack_200', 200, 't5',  4400,  3740),
  ('pack_500', 500, 't5',  8900,  7565)
on conflict (name, tier) do update set
  credits = excluded.credits,
  price_cents = excluded.price_cents,
  subscriber_price_cents = excluded.subscriber_price_cents;
