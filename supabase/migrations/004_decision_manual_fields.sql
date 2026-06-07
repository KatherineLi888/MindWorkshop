alter table public.decisions
  add column if not exists manual_conclusion text,
  add column if not exists manual_goal text;
