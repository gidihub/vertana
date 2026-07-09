-- Monthly code execution counter per organization (Judge0 usage visibility)

alter table organizations
  add column if not exists code_executions_used int not null default 0,
  add column if not exists code_executions_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month');

create or replace function public.increment_code_executions(org_id_input uuid, count_input int default 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update organizations
  set code_executions_used = code_executions_used + greatest(count_input, 0)
  where id = org_id_input;
end;
$$;

create or replace function public.reset_monthly_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update organizations
  set
    credits_remaining = case plan_tier
      when 'free' then 10
      when 'starter' then 100
      when 'growth' then 400
      else credits_remaining
    end,
    credits_reset_at = date_trunc('month', now()) + interval '1 month',
    ai_generations_used = 0,
    ai_generations_reset_at = date_trunc('month', now()) + interval '1 month',
    code_executions_used = 0,
    code_executions_reset_at = date_trunc('month', now()) + interval '1 month'
  where credits_reset_at <= now()
     or ai_generations_reset_at <= now()
     or code_executions_reset_at <= now();
end;
$$;
