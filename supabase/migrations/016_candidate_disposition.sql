-- Recruiter decision on a candidate attempt (separate from test score / attempt status).
alter table attempts
  add column if not exists disposition text not null default 'under_review'
    check (disposition in ('under_review', 'shortlisted', 'rejected', 'hired'));

create index if not exists attempts_disposition_idx on attempts (disposition);
