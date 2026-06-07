-- 目标执行区：截止日期、量化、关键结果（OKR）

alter table public.goals
  add column if not exists execution jsonb not null default jsonb_build_object(
    'due_date', null,
    'target_quantity', null,
    'current_quantity', 0,
    'quantity_unit', '',
    'key_results', '[]'::jsonb
  );
