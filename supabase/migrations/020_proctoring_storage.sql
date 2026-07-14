-- Proctoring storage bucket + org PPP tier for regional plan enforcement.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proctoring',
  'proctoring',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table organizations
  add column if not exists ppp_tier text;

alter table organizations
  drop constraint if exists organizations_ppp_tier_check;

alter table organizations
  add constraint organizations_ppp_tier_check
  check (
    ppp_tier is null
    or ppp_tier in ('anchor', 'sa_eg', 'gh', 'ke', 'floor')
  );
