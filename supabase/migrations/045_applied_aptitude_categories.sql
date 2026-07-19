-- Applied Aptitude parent + seven leaf screening categories.

insert into library_categories (id, name, parent_id, sort_order, priority_tier) values
  ('applied-aptitude', 'Applied Aptitude', null, 6, 2)
on conflict (id) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  priority_tier = excluded.priority_tier;

insert into library_categories (id, name, parent_id, sort_order, priority_tier) values
  ('reading-comprehension', 'Reading Comprehension', 'applied-aptitude', 1, 2),
  ('attention-to-detail', 'Attention to Detail', 'applied-aptitude', 2, 2),
  ('following-instructions', 'Following Instructions', 'applied-aptitude', 3, 2),
  ('applied-numeracy', 'Applied Numeracy', 'applied-aptitude', 4, 2),
  ('numerical-reasoning', 'Numerical Reasoning', 'applied-aptitude', 5, 2),
  ('critical-thinking', 'Critical Thinking', 'applied-aptitude', 6, 2),
  ('problem-solving', 'Problem Solving', 'applied-aptitude', 7, 2)
on conflict (id) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  priority_tier = excluded.priority_tier;
