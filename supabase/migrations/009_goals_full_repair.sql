-- 完整修复 public.goals（缺 title / goal_type 等列时执行）
-- 若从未跑过 001，请先执行 001_initial_schema.sql，再执行本文件

-- 表不存在则按标准结构创建
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  goal_type text not null default 'pending'
    check (goal_type in ('near', 'long', 'pending')),
  progress numeric not null default 0
    check (progress >= 0 and progress <= 100),
  smart_current jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  execution jsonb not null default jsonb_build_object(
    'start_date', null,
    'due_date', null,
    'target_quantity', null,
    'current_quantity', 0,
    'quantity_unit', '',
    'progressMode', 'auto',
    'key_results', '[]'::jsonb
  )
);

-- 表已存在但缺列：逐列补齐
alter table public.goals add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.goals add column if not exists title text;
alter table public.goals add column if not exists goal_type text;
alter table public.goals add column if not exists progress numeric default 0;
alter table public.goals add column if not exists smart_current jsonb default '{}'::jsonb;
alter table public.goals add column if not exists created_at timestamptz default now();
alter table public.goals add column if not exists updated_at timestamptz default now();
alter table public.goals add column if not exists execution jsonb default jsonb_build_object(
  'start_date', null,
  'due_date', null,
  'target_quantity', null,
  'current_quantity', 0,
  'quantity_unit', '',
  'progressMode', 'auto',
  'key_results', '[]'::jsonb
);

-- 空值回填（避免 set not null 失败）
update public.goals set title = '未命名目标' where title is null or btrim(title) = '';
update public.goals set goal_type = 'pending' where goal_type is null;
update public.goals set progress = 0 where progress is null;
update public.goals set smart_current = '{}'::jsonb where smart_current is null;
update public.goals set created_at = now() where created_at is null;
update public.goals set updated_at = now() where updated_at is null;
update public.goals set execution = jsonb_build_object(
  'start_date', null, 'due_date', null, 'target_quantity', null,
  'current_quantity', 0, 'quantity_unit', '', 'progressMode', 'auto',
  'key_results', '[]'::jsonb
) where execution is null;

alter table public.goals alter column title set not null;
alter table public.goals alter column goal_type set not null;
alter table public.goals alter column progress set not null;
alter table public.goals alter column smart_current set not null;
alter table public.goals alter column created_at set not null;
alter table public.goals alter column updated_at set not null;
alter table public.goals alter column execution set not null;

alter table public.goals drop constraint if exists goals_goal_type_check;
alter table public.goals add constraint goals_goal_type_check
  check (goal_type in ('near', 'long', 'pending'));

-- goal_smart_versions 表
create table if not exists public.goal_smart_versions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  smart_data jsonb not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;
alter table public.goal_smart_versions enable row level security;

drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals for all using (auth.uid() = user_id);

drop policy if exists "own goal_smart_versions" on public.goal_smart_versions;
create policy "own goal_smart_versions" on public.goal_smart_versions for all using (auth.uid() = user_id);

notify pgrst, 'reload schema';
