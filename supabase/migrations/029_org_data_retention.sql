-- Per-organization data retention for proctoring media.
-- null = use the global default (lib/proctoring/config.ts PROCTORING_RETENTION_DAYS).
-- When set, newly captured proctoring media expires this many days after capture,
-- and the purge edge function removes anything past its expires_at.

alter table organizations
  add column if not exists data_retention_days int
  check (data_retention_days is null or data_retention_days between 1 and 3650);
