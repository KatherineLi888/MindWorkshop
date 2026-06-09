-- 兼容 goals 表 type / goal_type 列（可重复执行）
-- 注意：必须先删 goals_type_check，见 012_goals_legacy_fix.sql

alter table public.goals drop constraint if exists goals_type_check;
alter table public.goals drop constraint if exists goals_goal_type_check;

alter table public.goals add column if not exists goal_type text;
alter table public.goals add column if not exists type text;

update public.goals set goal_type = type where goal_type is null and type is not null;
update public.goals set type = goal_type where type is null and goal_type is not null;
update public.goals set goal_type = coalesce(nullif(goal_type, ''), nullif(type, ''), 'pending');
update public.goals set type = goal_type;

-- 旧库可能有 target / short 等值，统一映射到应用支持的三种
update public.goals
set goal_type = case
  when goal_type in ('near', 'short', 'target') then 'near'
  when goal_type in ('long') then 'long'
  else 'pending'
end
where goal_type is null or goal_type not in ('near', 'long', 'pending');

update public.goals set type = goal_type;

alter table public.goals add constraint goals_goal_type_check
  check (goal_type in ('near', 'long', 'pending'));

notify pgrst, 'reload schema';
