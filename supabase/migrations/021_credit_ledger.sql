-- Credit ledger + plan/pack catalog + subscriptions.
--
-- The ledger is the single source of truth for candidate-credit balance:
--   balance = sum of non-expired deltas.
-- organizations.credits_remaining is kept as a cached mirror so existing reads
-- (candidate flow, dashboards) keep working without a schema-wide rewrite.
--
-- Consumption draws down soonest-expiring credits first (monthly grants expire
-- at period end, packs 24 months after purchase), so monthly credits are always
-- spent before pack credits, and older packs before newer ones. Each consumption
-- row is tagged with the grant it draws from (source_ledger_id) and inherits that
-- grant's expires_at, so "balance = sum of non-expired deltas" stays exact even
-- as grants expire (the unused remainder of an expired grant simply drops out).

-- ---------------------------------------------------------------------------
-- Catalog: plans + credit packs (seeded per PPP tier)
-- ---------------------------------------------------------------------------

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name in ('free', 'starter', 'growth', 'custom')),
  tier text not null
    check (tier in ('anchor', 'sa_eg', 'gh', 'ke', 'floor')),
  monthly_price_cents int,
  yearly_price_cents int,
  monthly_credits int,
  ai_generations_per_month int,
  active_test_limit int,
  has_certificates boolean not null default false,
  has_ats boolean not null default false,
  has_enterprise_controls boolean not null default false,
  -- Proctoring + face verification is a paid feature; false on Free only.
  has_proctoring boolean not null default true,
  stripe_monthly_price_id text,
  stripe_yearly_price_id text,
  unique (name, tier)
);

create table if not exists credit_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits int not null,
  tier text not null
    check (tier in ('anchor', 'sa_eg', 'gh', 'ke', 'floor')),
  price_cents int not null,
  subscriber_price_cents int not null,
  stripe_price_id text,
  unique (name, tier)
);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid references plans(id),
  billing_interval text check (billing_interval in ('monthly', 'yearly')),
  status text not null default 'active',
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_org_id_idx on subscriptions (org_id);

-- ---------------------------------------------------------------------------
-- Pack purchases
-- ---------------------------------------------------------------------------

create table if not exists pack_purchases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  credit_pack_id uuid references credit_packs(id),
  credits int not null,
  price_paid_cents int not null,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists pack_purchases_org_id_idx on pack_purchases (org_id);

-- ---------------------------------------------------------------------------
-- Credit ledger
-- ---------------------------------------------------------------------------

create table if not exists credit_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in (
    'monthly_grant', 'pack_purchase', 'attempt_start_proctored',
    'attempt_completion', 'refund', 'adjustment'
  )),
  attempt_id uuid,
  pack_purchase_id uuid references pack_purchases(id) on delete set null,
  -- Grant a consumption row draws from; inherits that grant's expiry.
  source_ledger_id uuid references credit_ledger(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_org_id_idx on credit_ledger (org_id);
create index if not exists credit_ledger_active_idx
  on credit_ledger (org_id, expires_at);

-- ---------------------------------------------------------------------------
-- RLS: org members read their own org's subscription, ledger, purchases.
-- Only the service role (webhooks, server actions) may insert ledger rows.
-- ---------------------------------------------------------------------------

alter table plans enable row level security;
alter table credit_packs enable row level security;
alter table subscriptions enable row level security;
alter table pack_purchases enable row level security;
alter table credit_ledger enable row level security;

-- Catalog is public (read-only) so the pricing page can render for anyone.
drop policy if exists plans_public_read on plans;
create policy plans_public_read on plans for select using (true);

drop policy if exists credit_packs_public_read on credit_packs;
create policy credit_packs_public_read on credit_packs for select using (true);

drop policy if exists subscriptions_org_read on subscriptions;
create policy subscriptions_org_read on subscriptions
  for select using (
    exists (
      select 1 from team_members tm
      where tm.org_id = subscriptions.org_id
        and tm.user_id = auth.uid()
    )
  );

drop policy if exists pack_purchases_org_read on pack_purchases;
create policy pack_purchases_org_read on pack_purchases
  for select using (
    exists (
      select 1 from team_members tm
      where tm.org_id = pack_purchases.org_id
        and tm.user_id = auth.uid()
    )
  );

drop policy if exists credit_ledger_org_read on credit_ledger;
create policy credit_ledger_org_read on credit_ledger
  for select using (
    exists (
      select 1 from team_members tm
      where tm.org_id = credit_ledger.org_id
        and tm.user_id = auth.uid()
    )
  );

-- No insert/update/delete policies: those operations require the service role,
-- which bypasses RLS. Anon/authenticated clients can only read.

-- ---------------------------------------------------------------------------
-- Ledger functions (all security definer, service-role callable)
-- ---------------------------------------------------------------------------

-- Current non-expired balance.
create or replace function public.credit_balance(org_id_input uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::int
  from credit_ledger
  where org_id = org_id_input
    and (expires_at is null or expires_at > now());
$$;

-- Keep organizations.credits_remaining in sync with the ledger.
create or replace function public.sync_credit_mirror(org_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update organizations
  set credits_remaining = public.credit_balance(org_id_input)
  where id = org_id_input;
end;
$$;

-- Migrate an org into the ledger the first time it is touched: seed a single
-- monthly grant equal to its current mirror balance so no credits are lost.
create or replace function public.ensure_credit_ledger_bootstrap(org_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  has_rows boolean;
  org_rec record;
begin
  select exists(select 1 from credit_ledger where org_id = org_id_input) into has_rows;
  if has_rows then
    return;
  end if;

  select credits_remaining, credits_reset_at into org_rec
  from organizations where id = org_id_input;

  if org_rec.credits_remaining is not null and org_rec.credits_remaining > 0 then
    insert into credit_ledger (org_id, delta, reason, expires_at)
    values (
      org_id_input,
      org_rec.credits_remaining,
      'monthly_grant',
      org_rec.credits_reset_at
    );
  end if;
end;
$$;

-- Consume `amount` credits (positive number). Draws from soonest-expiring grants
-- first. Returns false without mutating if the balance is insufficient.
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

-- Grant monthly plan credits (idempotent per period). Zeroes out the previous
-- period's unexpired remainder — monthly plan credits never roll over.
create or replace function public.grant_monthly_credits(
  org_id_input uuid,
  amount_input int,
  period_end_input timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  already boolean;
  prior record;
  prior_remaining int;
begin
  perform 1 from organizations where id = org_id_input for update;
  perform public.ensure_credit_ledger_bootstrap(org_id_input);

  -- Idempotency: a grant for this exact period already exists.
  select exists(
    select 1 from credit_ledger
    where org_id = org_id_input
      and reason = 'monthly_grant'
      and delta > 0
      and expires_at is not distinct from period_end_input
  ) into already;

  if already then
    return;
  end if;

  -- Expire remaining balance of prior active monthly grants (no rollover).
  for prior in
    select l.id, l.delta, l.expires_at
    from credit_ledger l
    where l.org_id = org_id_input
      and l.reason = 'monthly_grant'
      and l.delta > 0
      and (l.expires_at is null or l.expires_at > now())
  loop
    select prior.delta + coalesce((
      select sum(c.delta) from credit_ledger c where c.source_ledger_id = prior.id
    ), 0)
    into prior_remaining;

    if prior_remaining > 0 then
      insert into credit_ledger (org_id, delta, reason, source_ledger_id, expires_at)
      values (org_id_input, -prior_remaining, 'adjustment', prior.id, prior.expires_at);
    end if;
  end loop;

  insert into credit_ledger (org_id, delta, reason, expires_at)
  values (org_id_input, amount_input, 'monthly_grant', period_end_input);

  perform public.sync_credit_mirror(org_id_input);
end;
$$;

-- Record a one-time credit-pack purchase (24-month expiry). Idempotent per
-- Stripe payment intent.
create or replace function public.record_pack_purchase(
  org_id_input uuid,
  credit_pack_id_input uuid,
  credits_input int,
  price_paid_cents_input int,
  stripe_payment_intent_id_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase_id uuid;
begin
  perform 1 from organizations where id = org_id_input for update;
  perform public.ensure_credit_ledger_bootstrap(org_id_input);

  -- Idempotency guard on payment intent.
  if stripe_payment_intent_id_input is not null and exists(
    select 1 from pack_purchases
    where stripe_payment_intent_id = stripe_payment_intent_id_input
  ) then
    return;
  end if;

  insert into pack_purchases (
    org_id, credit_pack_id, credits, price_paid_cents, stripe_payment_intent_id
  ) values (
    org_id_input, credit_pack_id_input, credits_input, price_paid_cents_input,
    stripe_payment_intent_id_input
  )
  returning id into purchase_id;

  insert into credit_ledger (org_id, delta, reason, pack_purchase_id, expires_at)
  values (
    org_id_input, credits_input, 'pack_purchase', purchase_id,
    now() + interval '24 months'
  );

  perform public.sync_credit_mirror(org_id_input);
end;
$$;

-- ---------------------------------------------------------------------------
-- reset_monthly_credits: no longer touches candidate credits (ledger owns
-- those now). Still resets the AI + code-execution counters on schedule.
-- ---------------------------------------------------------------------------

create or replace function public.reset_monthly_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update organizations
  set
    ai_generations_used = 0,
    ai_generations_reset_at = date_trunc('month', now()) + interval '1 month',
    code_executions_used = 0,
    code_executions_reset_at = date_trunc('month', now()) + interval '1 month'
  where ai_generations_reset_at <= now()
     or code_executions_reset_at <= now();
end;
$$;
