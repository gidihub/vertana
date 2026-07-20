-- Blog E-E-A-T: sources list and optional correction note.

alter table blog_posts
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists correction_note text;

alter table blog_posts
  drop constraint if exists blog_posts_sources_is_array;

alter table blog_posts
  add constraint blog_posts_sources_is_array
  check (jsonb_typeof(sources) = 'array');

comment on column blog_posts.sources is
  'Array of { title, url, publisher, year } for the Sources section';
