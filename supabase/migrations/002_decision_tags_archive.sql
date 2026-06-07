-- 决策标签与归档

alter table public.decisions
  add column if not exists tag_executor text check (tag_executor in ('self', 'delegate')),
  add column if not exists tag_horizon text check (tag_horizon in ('short', 'long')),
  add column if not exists tag_outcome text not null default 'proceed' check (tag_outcome in ('proceed', 'abandon')),
  add column if not exists archived_at timestamptz;

create index if not exists decisions_user_archived_idx
  on public.decisions (user_id, archived_at);

create index if not exists decisions_tags_idx
  on public.decisions (user_id, tag_executor, tag_horizon, tag_outcome);
