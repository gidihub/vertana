-- Phase 2 proctoring scaffold: media storage + retention tracking.

create table if not exists proctoring_media (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  kind text not null check (kind in ('camera', 'screen', 'face_match')),
  storage_path text not null,
  vendor_ref text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists proctoring_media_attempt_id_idx
  on proctoring_media (attempt_id);

create index if not exists proctoring_media_expires_at_idx
  on proctoring_media (expires_at);

alter table proctoring_media enable row level security;

-- Recruiters read media metadata for attempts in their org (enforced in API).
create policy proctoring_media_org_read on proctoring_media
  for select
  using (
    exists (
      select 1
      from attempts a
      join test_invites ti on ti.id = a.test_invite_id
      join tests t on t.id = ti.test_id
      join team_members tm on tm.org_id = t.org_id
      where a.id = proctoring_media.attempt_id
        and tm.user_id = auth.uid()
    )
  );
