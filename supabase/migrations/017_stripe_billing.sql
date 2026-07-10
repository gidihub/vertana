-- Stripe billing: customer/subscription fields on organizations + webhook idempotency.

alter table organizations
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists billing_cycle text
    check (billing_cycle is null or billing_cycle in ('monthly', 'annual')),
  add column if not exists current_period_end timestamptz;

create unique index if not exists organizations_stripe_customer_id_key
  on organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists organizations_stripe_subscription_id_key
  on organizations (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table stripe_webhook_events enable row level security;
