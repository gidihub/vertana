-- Two-level library category taxonomy + category_id on questions

create table if not exists library_categories (
  id text primary key,
  name text not null,
  parent_id text references library_categories (id) on delete set null,
  sort_order int not null default 0,
  priority_tier int not null default 2 check (priority_tier in (1, 2, 3))
);

alter table questions
  add column if not exists category_id text references library_categories (id);

create index if not exists questions_category_id_idx
  on questions (category_id)
  where is_library_item = true;

-- Parents first, then leaves
insert into library_categories (id, name, parent_id, sort_order, priority_tier) values
  ('engineering', 'Engineering', null, 1, 1),
  ('data-analytics', 'Data & Analytics', null, 2, 1),
  ('business', 'Business', null, 3, 1),
  ('ai-fluency', 'AI Fluency', null, 4, 2),
  ('ways-of-working', 'Ways of Working', null, 5, 2)
on conflict (id) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  priority_tier = excluded.priority_tier;

insert into library_categories (id, name, parent_id, sort_order, priority_tier) values
  ('frontend-engineering', 'Frontend Engineering', 'engineering', 1, 1),
  ('backend-engineering', 'Backend Engineering', 'engineering', 2, 1),
  ('devops-cloud', 'DevOps & Cloud', 'engineering', 3, 2),
  ('qa-testing', 'QA & Testing', 'engineering', 4, 2),
  ('mobile-engineering', 'Mobile Engineering', 'engineering', 5, 3),
  ('database-administration', 'Database Administration', 'engineering', 6, 3),
  ('data-analyst', 'Data Analyst / Data Science', 'data-analytics', 1, 1),
  ('machine-learning', 'Machine Learning', 'data-analytics', 2, 1),
  ('project-program-associate', 'Project & Program Associate', 'business', 1, 1),
  ('business-financial-analysis', 'Business & Financial Analysis', 'business', 2, 2),
  ('customer-technical-support', 'Customer & Technical Support', 'business', 3, 2),
  ('sales-growth-marketing', 'Sales & Growth Marketing', 'business', 4, 2),
  ('ux-design', 'UX & Design', 'business', 5, 3),
  ('hr-people-management', 'HR & People Management', 'business', 6, 3),
  ('ai-assisted-work-sample', 'AI-Assisted Work Sample', 'ai-fluency', 1, 2),
  ('ai-governance', 'AI Governance & Responsible Use', 'ai-fluency', 2, 2),
  ('remote-collaboration', 'Remote Collaboration & Async Communication', 'ways-of-working', 1, 2)
on conflict (id) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  priority_tier = excluded.priority_tier;

-- Migrate existing flat library_category slugs → category_id + updated slug
update questions set
  category_id = 'frontend-engineering',
  library_category = 'frontend-engineering'
where is_library_item = true and library_category = 'frontend';

update questions set
  category_id = 'backend-engineering',
  library_category = 'backend-engineering'
where is_library_item = true and library_category = 'backend';

update questions set
  category_id = 'data-analyst',
  library_category = 'data-analyst'
where is_library_item = true and library_category = 'data';

update questions set
  category_id = 'machine-learning',
  library_category = 'machine-learning'
where is_library_item = true and library_category = 'ml';

update questions set
  category_id = 'project-program-associate',
  library_category = 'project-program-associate'
where is_library_item = true and library_category = 'consulting';

update questions set
  category_id = 'customer-technical-support',
  library_category = 'customer-technical-support'
where is_library_item = true and library_category = 'ops';
