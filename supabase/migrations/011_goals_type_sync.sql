-- 兼容 goals 表 type / goal_type 列（可重复执行）

alter table public.goals add column if not exists goal_type text;
alter table public.goals add column if not exists type text;

update public.goals set goal_type = type where goal_type is null and type is not null;
update public.goals set type = goal_type where type is null and goal_type is not null;
update public.goals set goal_type = coalesce(nullif(goal_type, ''), nullif(type, ''), 'pending');
update public.goals set type = goal_type;

alter table public.goals drop constraint if exists goals_goal_type_check;
alter table public.goals add constraint goals_goal_type_check
  check (goal_type in ('near', 'long', 'pending'));

notify pgrst, 'reload schema';
