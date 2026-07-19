-- Grading guidance for manual / AI-assisted short-answer review, plus optional
-- seniority for library screens (distinct from difficulty).

alter table questions
  add column if not exists rubric text,
  add column if not exists model_answer text,
  add column if not exists seniority text
    check (seniority is null or seniority in ('junior', 'mid', 'senior'));

-- ML bank: bracket tags in prompts are the explicit level signal in source JSON.
update questions set seniority = 'junior'
where is_library_item = true
  and coalesce(category_id, library_category) = 'machine-learning'
  and prompt like '[Classic ML]%';

update questions set seniority = 'senior'
where is_library_item = true
  and coalesce(category_id, library_category) = 'machine-learning'
  and (prompt like '[Judgment]%' or prompt like '[MLOps]%');

update questions set seniority = 'mid'
where is_library_item = true
  and coalesce(category_id, library_category) = 'machine-learning'
  and seniority is null;

-- MBB / associate bank: tag + low-resistance fundamentals → junior; judgment → senior.
update questions set seniority = 'senior'
where is_library_item = true
  and coalesce(category_id, library_category) = 'project-program-associate'
  and prompt like '[Business judgment]%';

update questions set seniority = 'junior'
where is_library_item = true
  and coalesce(category_id, library_category) = 'project-program-associate'
  and seniority is null
  and ai_resistance = 'low'
  and (
    prompt like '[Structured problem-solving]%'
    or prompt like '[Quantitative reasoning]%'
    or prompt like '[Market sizing & estimation]%'
    or prompt like '[Excel & data analysis]%'
  );

update questions set seniority = 'mid'
where is_library_item = true
  and coalesce(category_id, library_category) = 'project-program-associate'
  and seniority is null;
