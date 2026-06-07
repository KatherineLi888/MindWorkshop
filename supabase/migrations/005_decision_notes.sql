alter table public.decisions
  add column if not exists decision_notes jsonb not null default '[]'::jsonb;
