-- 思绪工坊 · 本地模块云端化（思考、种子、杂项 JSON 数据）

-- 思考会话（整棵思维树存 JSONB）
create table if not exists public.thinking_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  session_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 想法种子
create table if not exists public.idea_seeds (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  seed_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 种子 ↔ 实体映射
create table if not exists public.seed_entity_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_key text not null,
  seed_id uuid not null,
  primary key (user_id, entity_key)
);

-- 杂项用户数据（模型库、理论库、画布、复盘等 JSON 快照）
create table if not exists public.user_misc_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

-- RLS
alter table public.thinking_sessions enable row level security;
alter table public.idea_seeds enable row level security;
alter table public.seed_entity_links enable row level security;
alter table public.user_misc_data enable row level security;

create policy "own thinking_sessions" on public.thinking_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own idea_seeds" on public.idea_seeds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own seed_entity_links" on public.seed_entity_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own user_misc_data" on public.user_misc_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 实时发布（可选）
alter publication supabase_realtime add table public.thinking_sessions;
alter publication supabase_realtime add table public.idea_seeds;
