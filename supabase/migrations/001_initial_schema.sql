-- 思绪工坊 · 初始 schema（在 Supabase SQL Editor 中执行）

-- 用户配置（含 OpenAI Key，仅本人可读）
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  openai_api_key text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 决策记录
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source text not null check (source in ('active', 'passive')),
  path_summary text not null default '',
  final_action text not null default '',
  flow_state jsonb not null default '{}',
  background text,
  constraints text,
  personal_notes text,
  flow_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 目标
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  goal_type text not null check (goal_type in ('near', 'long', 'pending')),
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  smart_current jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_smart_versions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  smart_data jsonb not null,
  note text,
  created_at timestamptz not null default now()
);

-- 问题图谱节点
create table if not exists public.graph_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_type text not null check (node_type in ('problem', 'idea', 'practice', 'related')),
  title text not null,
  background text default '',
  status text not null default 'tracking' check (status in ('tracking', 'paused', 'abandoned', 'ongoing')),
  position_x numeric not null default 0,
  position_y numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.graph_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.graph_nodes(id) on delete cascade,
  target_id uuid not null references public.graph_nodes(id) on delete cascade,
  label text default '',
  created_at timestamptz not null default now()
);

-- 思维模型
create table if not exists public.thinking_models (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  model_type text not null check (model_type in ('quadrant', 'stage')),
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 自检笔记
create table if not exists public.self_check_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model_id uuid references public.thinking_models(id) on delete set null,
  region_key text,
  related_item text,
  current_state text default '',
  gaps text default '',
  breakthrough text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 知识画布（整库 JSON + 元数据）
create table if not exists public.canvas_vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '默认画布库',
  vault_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 统一多对多关联
create table if not exists public.entity_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, from_type, from_id, to_type, to_id)
);

-- 收集箱条目（显式待定项）
create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  ref_id uuid,
  title text not null,
  payload jsonb default '{}',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.user_settings enable row level security;
alter table public.decisions enable row level security;
alter table public.goals enable row level security;
alter table public.goal_smart_versions enable row level security;
alter table public.graph_nodes enable row level security;
alter table public.graph_edges enable row level security;
alter table public.thinking_models enable row level security;
alter table public.self_check_notes enable row level security;
alter table public.canvas_vaults enable row level security;
alter table public.entity_links enable row level security;
alter table public.inbox_items enable row level security;

create policy "own user_settings" on public.user_settings for all using (auth.uid() = user_id);
create policy "own decisions" on public.decisions for all using (auth.uid() = user_id);
create policy "own goals" on public.goals for all using (auth.uid() = user_id);
create policy "own goal_smart_versions" on public.goal_smart_versions for all using (auth.uid() = user_id);
create policy "own graph_nodes" on public.graph_nodes for all using (auth.uid() = user_id);
create policy "own graph_edges" on public.graph_edges for all using (auth.uid() = user_id);
create policy "own thinking_models" on public.thinking_models for all using (auth.uid() = user_id);
create policy "own self_check_notes" on public.self_check_notes for all using (auth.uid() = user_id);
create policy "own canvas_vaults" on public.canvas_vaults for all using (auth.uid() = user_id);
create policy "own entity_links" on public.entity_links for all using (auth.uid() = user_id);
create policy "own inbox_items" on public.inbox_items for all using (auth.uid() = user_id);

-- 实时发布
alter publication supabase_realtime add table public.decisions;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.graph_nodes;
alter publication supabase_realtime add table public.canvas_vaults;
alter publication supabase_realtime add table public.entity_links;
