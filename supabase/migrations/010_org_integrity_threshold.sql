alter table organizations
  add column if not exists tab_switch_threshold int not null default 3;
