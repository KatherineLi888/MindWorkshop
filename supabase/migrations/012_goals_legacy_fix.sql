-- 一次性修复 goals 旧表（name/title、type/goal_type、旧约束）
-- 在 Supabase SQL Editor 整段执行，可重复运行

-- ① 先删掉旧约束（必须在改 type 列之前）
alter table public.goals drop constraint if exists goals_type_check;
alter table public.goals drop constraint if exists goals_goal_type_check;

-- ② 补齐列
alter table public.goals add column if not exists title text;
alter table public.goals add column if not exists name text;
alter table public.goals add column if not exists goal_type text;
alter table public.goals add column if not exists type text;
alter table public.goals add column if not exists progress numeric default 0;
alter table public.goals add column if not exists smart_current jsonb default '{}';
alter table public.goals add column if not exists execution jsonb default '{}';

-- ③ 同步 title ↔ name
update public.goals set title = name where (title is null or title = '') and name is not null;
update public.goals set name = title where (name is null or name = '') and title is not null;
update public.goals set title = coalesce(nullif(title, ''), nullif(name, ''), '未命名目标');
update public.goals set name = title;

-- ④ 同步 type ↔ goal_type（旧值 target/short → near）
update public.goals set goal_type = type where goal_type is null and type is not null;
update public.goals set type = goal_type where type is null and goal_type is not null;
update public.goals set goal_type = coalesce(nullif(goal_type, ''), nullif(type, ''), 'pending');

update public.goals
set goal_type = case
  when goal_type in ('near', 'short', 'target') then 'near'
  when goal_type = 'long' then 'long'
  else 'pending'
end
where goal_type is null or goal_type not in ('near', 'long', 'pending');

update public.goals set type = goal_type;

-- ⑤ 只给 goal_type 加约束（type 列不再加旧约束）
alter table public.goals add constraint goals_goal_type_check
  check (goal_type in ('near', 'long', 'pending'));

notify pgrst, 'reload schema';
