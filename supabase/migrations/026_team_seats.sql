-- Team seats: included counts + extra-seat price per plan/tier, plus a live
-- extra_seats counter on organizations (the authoritative billing record).
-- Seat allowance = seats_included + extra_seats (Custom = unlimited / null).
-- Enforcement lives in lib/db/team.ts; the extra-seat purchase flow updates the
-- Stripe subscription quantity and syncs extra_seats back here via the webhook.

alter table plans
  add column if not exists seats_included int;

alter table plans
  add column if not exists extra_seat_price_cents int;

-- Stripe recurring Price for one extra seat at this plan's PPP tier
-- (provisioned by scripts/setup-stripe.ts).
alter table plans
  add column if not exists stripe_extra_seat_price_id text;

alter table organizations
  add column if not exists extra_seats int not null default 0;

-- Included seats are identical across PPP tiers (values mirror lib/pricing/config.ts).
update plans set seats_included = case name
  when 'free' then 2
  when 'starter' then 5
  when 'growth' then 10
  else null -- custom = unlimited
end;

-- Extra-seat monthly price scales down with the PPP tier. Paid plans only.
update plans set extra_seat_price_cents = case
  when name in ('free', 'custom') then null
  when tier = 't1' then 500
  when tier = 't2' then 400
  when tier = 't3' then 300
  when tier = 't4' then 200
  when tier = 't5' then 100
  else 500
end;
