-- Staff CMS: blog, authors, announcements, feedback.

-- ---------------------------------------------------------------------------
-- Profiles (staff flag — not self-serviceable)
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_staff boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke update (is_staff) on profiles from anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Blog authors (slug is primary key — no FK from posts)
-- ---------------------------------------------------------------------------

create table if not exists blog_authors (
  slug text primary key,
  name text not null,
  title text not null default '',
  bio text not null default '',
  avatar_url text,
  twitter_url text,
  linkedin_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists blog_authors_updated_at on blog_authors;
create trigger blog_authors_updated_at
  before update on blog_authors
  for each row execute function public.set_updated_at();

insert into blog_authors (slug, name, title, bio, published)
values (
  'vertana-team',
  'Vertana team',
  'Product & hiring',
  'Updates from the team building Vertana.',
  true
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Blog posts
-- ---------------------------------------------------------------------------

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  category text not null default 'Guides',
  author text not null default 'vertana-team',
  cover_image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  read_time text not null default '5 min read',
  tags text[] not null default '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists blog_posts_slug_active_uidx
  on blog_posts (slug)
  where deleted_at is null;
create index if not exists blog_posts_slug_idx on blog_posts (slug);
create index if not exists blog_posts_published_idx
  on blog_posts (published_at desc)
  where status = 'published' and deleted_at is null;

drop trigger if exists blog_posts_updated_at on blog_posts;
create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Announcements & feedback
-- ---------------------------------------------------------------------------

create table if not exists cms_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  link_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cms_announcements_updated_at on cms_announcements;
create trigger cms_announcements_updated_at
  before update on cms_announcements
  for each row execute function public.set_updated_at();

create table if not exists cms_feedback (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'website',
  message text not null,
  email text,
  page_url text,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cms_feedback_updated_at on cms_feedback;
create trigger cms_feedback_updated_at
  before update on cms_feedback
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table blog_authors enable row level security;
alter table blog_posts enable row level security;
alter table cms_announcements enable row level security;
alter table cms_feedback enable row level security;

create policy "Users read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Public read published authors"
  on blog_authors for select
  using (published = true);

create policy "Staff manage authors"
  on blog_authors for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true));

create policy "Public read published posts"
  on blog_posts for select
  using (status = 'published' and deleted_at is null);

create policy "Staff manage blog posts"
  on blog_posts for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true));

create policy "Public read published announcements"
  on cms_announcements for select
  using (published = true);

create policy "Staff manage announcements"
  on cms_announcements for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true));

create policy "Anyone can submit feedback"
  on cms_feedback for insert
  with check (true);

create policy "Staff read feedback"
  on cms_feedback for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true));

create policy "Staff update feedback"
  on cms_feedback for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_staff = true));

-- ---------------------------------------------------------------------------
-- Storage: blog-featured (public read, staff write via service role in API)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('blog-featured', 'blog-featured', true)
on conflict (id) do nothing;

create policy "Public read blog featured images"
  on storage.objects for select
  using (bucket_id = 'blog-featured');
