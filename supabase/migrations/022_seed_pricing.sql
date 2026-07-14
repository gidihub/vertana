-- Seed the plan + credit-pack catalog, one row per plan/pack per PPP tier.
-- Values mirror lib/pricing/config.ts (the runtime source of truth). Stripe
-- Price IDs are environment-specific and resolved from env vars at checkout,
-- so they are left null here.

-- Ensure the proctoring column exists even if migration 021 was applied before
-- this column was added (idempotent — safe to run on a fresh or existing DB).
alter table plans
  add column if not exists has_proctoring boolean not null default true;

-- Plans -------------------------------------------------------------------
insert into plans (
  name, tier, monthly_price_cents, yearly_price_cents, monthly_credits,
  ai_generations_per_month, active_test_limit,
  has_certificates, has_ats, has_enterprise_controls, has_proctoring
) values
  -- Free (identical across tiers) — no proctoring
  ('free', 'anchor', 0, 0, 10, 5, 2, false, false, false, false),
  ('free', 'sa_eg',  0, 0, 10, 5, 2, false, false, false, false),
  ('free', 'gh',     0, 0, 10, 5, 2, false, false, false, false),
  ('free', 'ke',     0, 0, 10, 5, 2, false, false, false, false),
  ('free', 'floor',  0, 0, 10, 5, 2, false, false, false, false),
  -- Starter
  ('starter', 'anchor', 1900, 15600, 100, 30, null, true, false, false, true),
  ('starter', 'sa_eg',   900,  7200, 100, 30, null, true, false, false, true),
  ('starter', 'gh',      700,  6000, 100, 30, null, true, false, false, true),
  ('starter', 'ke',      600,  4800, 100, 30, null, true, false, false, true),
  ('starter', 'floor',   500,  3600, 100, 30, null, true, false, false, true),
  -- Growth
  ('growth', 'anchor', 3900, 32400, 300, 100, null, true, true, false, true),
  ('growth', 'sa_eg',  1900, 15600, 300, 100, null, true, true, false, true),
  ('growth', 'gh',     1500, 12000, 300, 100, null, true, true, false, true),
  ('growth', 'ke',     1300, 10800, 300, 100, null, true, true, false, true),
  ('growth', 'floor',  1000,  8400, 300, 100, null, true, true, false, true),
  -- Custom (contact sales)
  ('custom', 'anchor', null, null, null, null, null, true, true, true, true),
  ('custom', 'sa_eg',  null, null, null, null, null, true, true, true, true),
  ('custom', 'gh',     null, null, null, null, null, true, true, true, true),
  ('custom', 'ke',     null, null, null, null, null, true, true, true, true),
  ('custom', 'floor',  null, null, null, null, null, true, true, true, true)
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

-- Credit packs ------------------------------------------------------------
insert into credit_packs (name, credits, tier, price_cents, subscriber_price_cents) values
  -- anchor (no discount)
  ('pack_50',  50,  'anchor',  4900,  4165),
  ('pack_200', 200, 'anchor', 14900, 12665),
  ('pack_500', 500, 'anchor', 29900, 25415),
  -- sa_eg (50% off)
  ('pack_50',  50,  'sa_eg',   2400,  2040),
  ('pack_200', 200, 'sa_eg',   7400,  6290),
  ('pack_500', 500, 'sa_eg',  14900, 12665),
  -- gh (55% off)
  ('pack_50',  50,  'gh',      2200,  1870),
  ('pack_200', 200, 'gh',      6700,  5695),
  ('pack_500', 500, 'gh',     13400, 11390),
  -- ke (60% off)
  ('pack_50',  50,  'ke',      1900,  1615),
  ('pack_200', 200, 'ke',      5900,  5015),
  ('pack_500', 500, 'ke',     11900, 10115),
  -- floor (65% off)
  ('pack_50',  50,  'floor',   1700,  1445),
  ('pack_200', 200, 'floor',   5200,  4420),
  ('pack_500', 500, 'floor',  10400,  8840)
on conflict (name, tier) do update set
  credits = excluded.credits,
  price_cents = excluded.price_cents,
  subscriber_price_cents = excluded.subscriber_price_cents;
