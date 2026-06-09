-- 修复 goals 表结构（若只执行过 007 等局部迁移，或 PostgREST schema cache 过期）
-- 在 Supabase SQL Editor 中执行本文件后，底部 NOTIFY 会刷新 API 缓存

-- goal_type（001 必需列）
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'goals' and column_name = 'goal_type'
  ) then
    alter table public.goals
      add column goal_type text not null default 'pending';
  end if;
end $$;

alter table public.goals
  drop constraint if exists goals_goal_type_check;

alter table public.goals
  add constraint goals_goal_type_check
  check (goal_type in ('near', 'long', 'pending'));

-- progress / smart_current（001）
alter table public.goals
  add column if not exists progress numeric not null default 0;

alter table public.goals
  add column if not exists smart_current jsonb not null default '{}'::jsonb;

alter table public.goals
  add column if not exists created_at timestamptz not null default now();

alter table public.goals
  add column if not exists updated_at timestamptz not null default now();

-- execution（003）
alter table public.goals
  add column if not exists execution jsonb not null default jsonb_build_object(
    'start_date', null,
    'due_date', null,
    'target_quantity', null,
    'current_quantity', 0,
    'quantity_unit', '',
    'progressMode', 'auto',
    'key_results', '[]'::jsonb
  );

-- 刷新 PostgREST schema cache（解决 "Could not find column in schema cache"）
notify pgrst, 'reload schema';
