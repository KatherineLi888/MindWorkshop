-- 兼容 goals 表同时使用 name / title 列（可重复执行，勿重跑 001）
-- 001 若报 policy already exists，说明库已建过，跳过 001，只跑本文件 + 009

alter table public.goals add column if not exists title text;
alter table public.goals add column if not exists name text;

update public.goals set title = name where (title is null or btrim(title) = '') and name is not null;
update public.goals set name = title where (name is null or btrim(name) = '') and title is not null;
update public.goals set title = coalesce(nullif(btrim(title), ''), nullif(btrim(name), ''), '未命名目标');
update public.goals set name = title;

alter table public.goals alter column title set not null;
alter table public.goals alter column name set not null;

notify pgrst, 'reload schema';
