-- Schedule the app's cron endpoints from inside Postgres using pg_cron + pg_net.
--
-- Why: vercel.json only fires crons when hosted on Vercel. When deployed
-- elsewhere (e.g. DigitalOcean) that schedule does nothing, so we drive the
-- same authenticated HTTP endpoints directly from Supabase. This is
-- host-independent and needs no extra infrastructure.
--
-- ONE-TIME SETUP (run once per environment, values NOT stored in this file):
--
--   select vault.create_secret('https://your-app-domain.com', 'app_base_url');
--   select vault.create_secret('<your CRON_SECRET>',          'cron_secret');
--
--   -- To rotate later:
--   -- select vault.update_secret(
--   --   (select id from vault.secrets where name = 'app_base_url'),
--   --   'https://new-domain.com');
--
-- The endpoints require `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET
-- is set in the app env. Keep the vault `cron_secret` in sync with that value.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Issues a POST to one of the app's cron endpoints, pulling the base URL and
-- bearer secret from Vault at call time so secrets never live in the schedule.
create or replace function public.invoke_app_cron(path text)
returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  base_url text;
  secret   text;
  req_id   bigint;
begin
  select decrypted_secret into base_url
  from vault.decrypted_secrets
  where name = 'app_base_url';

  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'cron_secret';

  if base_url is null then
    raise exception 'Missing vault secret "app_base_url"; run vault.create_secret(...) first';
  end if;

  if secret is null then
    raise exception 'Missing vault secret "cron_secret"; run vault.create_secret(...) first';
  end if;

  -- Only allow the known cron endpoints. Prevents a caller from redirecting the
  -- bearer CRON_SECRET to an arbitrary path/endpoint.
  if path not in (
    '/api/cron/process-scheduled-invites',
    '/api/cron/send-invite-reminders',
    '/api/cron/process-ats-deliveries'
  ) then
    raise exception 'Unsupported cron path: %', path;
  end if;

  select net.http_post(
    url := base_url || path,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) into req_id;

  return req_id;
end;
$$;

-- This function carries the CRON_SECRET, so it must not be callable by anyone.
-- Revoke the default PUBLIC execute grant and allow only the role that owns the
-- scheduled cron jobs (postgres in Supabase) to invoke it.
revoke execute on function public.invoke_app_cron(text) from public;
grant execute on function public.invoke_app_cron(text) to postgres;

-- Remove any prior copies of these jobs so re-running the migration is safe.
select cron.unschedule(jobid)
from cron.job
where jobname in (
  'process-scheduled-invites',
  'send-invite-reminders',
  'process-ats-deliveries'
);

-- Mirror the schedules from vercel.json.
select cron.schedule(
  'process-scheduled-invites',
  '*/5 * * * *',
  $$ select public.invoke_app_cron('/api/cron/process-scheduled-invites'); $$
);

select cron.schedule(
  'send-invite-reminders',
  '0 * * * *',
  $$ select public.invoke_app_cron('/api/cron/send-invite-reminders'); $$
);

select cron.schedule(
  'process-ats-deliveries',
  '*/5 * * * *',
  $$ select public.invoke_app_cron('/api/cron/process-ats-deliveries'); $$
);
