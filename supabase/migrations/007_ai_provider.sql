alter table public.user_settings
  add column if not exists ai_provider text not null default 'openai';

alter table public.user_settings
  drop constraint if exists user_settings_ai_provider_check;

alter table public.user_settings
  add constraint user_settings_ai_provider_check
  check (ai_provider in ('openai', 'deepseek'));
